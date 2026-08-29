import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {

    var webView: WKWebView!
    var refreshControl = UIRefreshControl()
    let defaultServerUrl = "http://192.168.84.103:3000"

    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadServerUrl()
    }

    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.preferences.javaScriptEnabled = true

        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true

        refreshControl.addTarget(self, action: #selector(reloadPage), for: .valueChanged)
        webView.scrollView.addSubview(refreshControl)

        view.addSubview(webView)
    }

    @objc private func reloadPage() {
        webView.reload()
    }

    private func loadServerUrl() {
        let serverUrl = UserDefaults.standard.string(forKey: "server_url") ?? defaultServerUrl
        if let url = URL(string: serverUrl) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        refreshControl.endRefreshing()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        refreshControl.endRefreshing()
        showConnectionErrorDialog()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        refreshControl.endRefreshing()
        showConnectionErrorDialog()
    }

    private func showConnectionErrorDialog() {
        let currentUrl = UserDefaults.standard.string(forKey: "server_url") ?? defaultServerUrl
        let alert = UIAlertController(title: "Connection Failed",
                                      message: "Cannot reach Grocery POS at \(currentUrl).\nUpdate server IP / URL below:",
                                      preferredStyle: .alert)

        alert.addTextField { textField in
            textField.text = currentUrl
            textField.keyboardType = .URL
        }

        alert.addAction(UIAlertAction(title: "Connect", style: .default, handler: { [weak self] _ in
            if let newUrl = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines), !newUrl.isEmpty {
                let formattedUrl = newUrl.hasPrefix("http") ? newUrl : "http://\(newUrl)"
                UserDefaults.standard.set(formattedUrl, forKey: "server_url")
                if let url = URL(string: formattedUrl) {
                    self?.webView.load(URLRequest(url: url))
                }
            }
        }))

        alert.addAction(UIAlertAction(title: "Retry", style: .cancel, handler: { [weak self] _ in
            self?.webView.reload()
        }))

        present(alert, animated: true, completion: nil)
    }
}
