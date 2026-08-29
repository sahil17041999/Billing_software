/* ==========================================================================
   GROCERY BILLING ERP - STANDARD JQUERY VALIDATION & UI HELPER SUITE
   ========================================================================== */

(function (global, $) {
  'use strict';

  // ------------------------------------------------------------------------
  // 1. TOAST NOTIFICATION SYSTEM
  // ------------------------------------------------------------------------
  const Toast = {
    container: null,

    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    },

    show(message, type = 'info', duration = 3200) {
      if (window.Swal) {
        const icon = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
        return Swal.fire({
          toast: true,
          position: 'top-end',
          icon: icon,
          title: message,
          showConfirmButton: false,
          timer: duration,
          timerProgressBar: true
        });
      }

      this.init();
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
      toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
      this.container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // ------------------------------------------------------------------------
  // 2. JQUERY VALIDATOR EXTENSIONS & CUSTOM RULES
  // ------------------------------------------------------------------------
  if (typeof $ !== 'undefined' && typeof $.validator !== 'undefined') {

    // Indian Mobile Number Validation (10 digits starting with 6-9)
    $.validator.addMethod('phoneIN', function (value, element) {
      return this.optional(element) || /^[6-9]\d{9}$/.test(String(value).trim().replace(/[\s-]/g, ''));
    }, 'Please enter a valid 10-digit Indian mobile number.');

    // Indian GSTIN (Goods and Services Tax Identification Number)
    $.validator.addMethod('gstin', function (value, element) {
      return this.optional(element) || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(String(value).trim().toUpperCase());
    }, 'Please enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5).');

    // Indian PAN (Permanent Account Number)
    $.validator.addMethod('pan', function (value, element) {
      return this.optional(element) || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(value).trim().toUpperCase());
    }, 'Please enter a valid 10-character PAN (e.g. ABCDE1234F).');

    // Indian Postal Pincode (6 digits)
    $.validator.addMethod('pincode', function (value, element) {
      return this.optional(element) || /^[1-9][0-9]{5}$/.test(String(value).trim());
    }, 'Please enter a valid 6-digit postal pincode.');

    // Positive Number (greater than 0)
    $.validator.addMethod('positiveNumber', function (value, element) {
      return this.optional(element) || (parseFloat(value) > 0);
    }, 'Please enter a value greater than 0.');

    // Non-Negative Number (greater than or equal to 0)
    $.validator.addMethod('nonNegativeNumber', function (value, element) {
      return this.optional(element) || (parseFloat(value) >= 0);
    }, 'Value cannot be negative.');

    // Valid Percentage (0 to 100)
    $.validator.addMethod('validPercentage', function (value, element) {
      if (this.optional(element)) return true;
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, 'Please enter a valid percentage between 0 and 100.');

    // Alphanumeric with spaces, dashes, dots
    $.validator.addMethod('alphanumericCustom', function (value, element) {
      return this.optional(element) || /^[a-zA-Z0-9\s.,\-_#&()/]+$/.test(String(value).trim());
    }, 'Please enter letters, numbers, and standard punctuation only.');

    // Valid Date Check
    $.validator.addMethod('validDate', function (value, element) {
      return this.optional(element) || !isNaN(Date.parse(value));
    }, 'Please enter a valid date.');

    // Global Default Configuration for jQuery Validation
    $.validator.setDefaults({
      errorElement: 'span',
      errorClass: 'invalid-feedback-custom',
      validClass: 'is-valid',
      errorPlacement: function (error, element) {
        error.addClass('field-error-text');
        const parent = element.parent();
        if (parent.hasClass('input-group') || parent.hasClass('search-input-group') || parent.hasClass('login-input-wrapper') || parent.hasClass('date-input-wrapper')) {
          error.insertAfter(parent);
        } else {
          error.insertAfter(element);
        }
      },
      highlight: function (element, errorClass, validClass) {
        $(element).addClass('is-invalid').removeClass('is-valid');
      },
      unhighlight: function (element, errorClass, validClass) {
        $(element).removeClass('is-invalid').addClass('is-valid');
      },
      invalidHandler: function (event, validator) {
        if (validator.errorList.length > 0) {
          const firstErrorElement = $(validator.errorList[0].element);
          firstErrorElement.focus();
          try {
            firstErrorElement[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (e) {}
        }
      }
    });
  }

  // ------------------------------------------------------------------------
  // 3. STANDARD FORM VALIDATION & AJAX HANDLER
  // ------------------------------------------------------------------------
  const AppFormHelper = {
    /**
     * Bind standard jQuery validation with automated AJAX submission,
     * button spinner states, error feedback, and toast notifications.
     */
    bind(formSelector, options = {}) {
      if (typeof $ === 'undefined' || !$(formSelector).length) return null;

      const $form = $(formSelector);
      const submitBtn = $form.find('[type="submit"]');
      const originalBtnHtml = submitBtn.html();

      const validatorConfig = {
        rules: options.rules || {},
        messages: options.messages || {},
        submitHandler: function (form, event) {
          if (event) event.preventDefault();

          if (typeof options.beforeSubmit === 'function') {
            const shouldContinue = options.beforeSubmit(form);
            if (shouldContinue === false) return;
          }

          // If custom submit handler is provided, delegate to it
          if (typeof options.onSubmit === 'function') {
            return options.onSubmit(form, $form);
          }

          // Standard automated AJAX submission
          const url = options.url || $form.attr('action') || window.location.href;
          const method = (options.method || $form.attr('method') || 'POST').toUpperCase();
          
          let requestBody = null;
          let isJson = true;

          if (typeof options.getPayload === 'function') {
            requestBody = options.getPayload(form, $form);
          } else {
            const formData = new FormData(form);
            const object = {};
            formData.forEach((value, key) => {
              object[key] = value;
            });
            requestBody = object;
          }

          // UI Loading state
          submitBtn.prop('disabled', true);
          submitBtn.html('<i class="ti ti-loader-2" style="animation: loaderSpin 0.75s linear infinite; display: inline-block;"></i> Processing...');
          if (options.loaderText && typeof showPageLoader === 'function') {
            showPageLoader(options.loaderText);
          }

          const fetchOptions = {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
          };

          fetch(url, fetchOptions)
            .then(res => res.json().then(data => ({ ok: res.ok, status: res.status, data })))
            .then(({ ok, status, data }) => {
              submitBtn.prop('disabled', false);
              submitBtn.html(originalBtnHtml);
              if (typeof hidePageLoader === 'function') hidePageLoader();

              if (ok && (data.success || status === 200 || status === 201)) {
                if (options.modalSelector) {
                  $(options.modalSelector).removeClass('show');
                }
                const successMsg = data.message || options.successMessage || 'Operation completed successfully!';
                Toast.show(successMsg, 'success');

                if (typeof options.onSuccess === 'function') {
                  options.onSuccess(data);
                } else {
                  setTimeout(() => {
                    if (options.redirectUrl) window.location.href = options.redirectUrl;
                    else window.location.reload();
                  }, 1100);
                }
              } else {
                let errorMsg = 'Failed to process request';
                if (data.errors) {
                  errorMsg = Array.isArray(data.errors) ? data.errors.join('<br>') : Object.values(data.errors).flat().join('<br>');
                } else if (data.error) {
                  errorMsg = data.error;
                } else if (data.message) {
                  errorMsg = data.message;
                }

                if (typeof showError === 'function') {
                  showError('Operation Failed', errorMsg);
                } else {
                  Toast.show(errorMsg, 'error');
                }

                if (typeof options.onError === 'function') {
                  options.onError(data);
                }
              }
            })
            .catch(err => {
              submitBtn.prop('disabled', false);
              submitBtn.html(originalBtnHtml);
              if (typeof hidePageLoader === 'function') hidePageLoader();

              const netError = 'Network or connection error. Please try again.';
              if (typeof showError === 'function') {
                showError('Network Error', netError);
              } else {
                Toast.show(netError, 'error');
              }

              if (typeof options.onError === 'function') {
                options.onError(err);
              }
            });
        }
      };

      const validator = $form.validate(validatorConfig);

      // Auto-reset errors when form is reset
      $form.on('reset', function () {
        validator.resetForm();
        $form.find('.is-invalid').removeClass('is-invalid');
        $form.find('.is-valid').removeClass('is-valid');
      });

      return validator;
    },

    /**
     * Reset validation state on a form
     */
    reset(formSelector) {
      if (typeof $ === 'undefined') return;
      const $form = $(formSelector);
      const validator = $form.data('validator');
      if (validator) validator.resetForm();
      $form.find('.is-invalid').removeClass('is-invalid');
      $form.find('.is-valid').removeClass('is-valid');
      $form.find('.invalid-feedback-custom').remove();
    }
  };

  // ------------------------------------------------------------------------
  // 4. UTILITY HELPERS: CURRENCY & DATE
  // ------------------------------------------------------------------------
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // ------------------------------------------------------------------------
  // 5. EXPORT GLOBALLY
  // ------------------------------------------------------------------------
  global.AppToast = Toast;
  global.showToast = (msg, type, duration) => Toast.show(msg, type, duration);
  global.AppFormHelper = AppFormHelper;
  global.initFormValidation = (form, options) => AppFormHelper.bind(form, options);
  global.resetFormValidation = (form) => AppFormHelper.reset(form);
  global.formatCurrency = formatCurrency;
  global.formatDate = formatDate;

})(window, typeof jQuery !== 'undefined' ? jQuery : undefined);