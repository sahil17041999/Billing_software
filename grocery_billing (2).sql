-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 29, 2026 at 09:11 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `grocery_billing`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `action` enum('create','update','delete','view') NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `brands`
--

CREATE TABLE `brands` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `brands`
--

INSERT INTO `brands` (`id`, `company_id`, `name`, `description`, `logo_path`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'v', '', NULL, 1, '2026-08-17 06:31:23', '2026-08-17 06:31:23'),
(2, 1, 'Bakery', '', NULL, 1, '2026-08-24 03:46:49', '2026-08-24 03:46:49'),
(3, 1, 'df', '', NULL, 1, '2026-08-28 03:35:50', '2026-08-28 03:35:50');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_category_id` int(11) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `company_id`, `name`, `description`, `parent_category_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Dairy & Milk', NULL, NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, 1, 'Vegetables', NULL, NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(3, 1, 'Fruits', '', NULL, 1, '0000-00-00 00:00:00', '2026-08-24 04:13:24'),
(4, 1, 'Cereals & Grains', '', NULL, 1, '0000-00-00 00:00:00', '2026-08-18 06:46:29'),
(5, 1, 'Beverages', '', NULL, 1, '0000-00-00 00:00:00', '2026-08-20 08:09:45'),
(6, 1, 'Bakery', '', NULL, 1, '0000-00-00 00:00:00', '2026-08-24 04:13:29');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `email`, `phone`, `address`, `city`, `state`, `postal_code`, `gstin`, `pan`, `logo_path`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Sample Store', 'store@example.com', '9999999999', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '0000-00-00 00:00:00', '2026-08-29 05:02:39'),
(2, 'Metro Mega Supermarket', 'vikram.9876512857@metromart.in', '9876512857', NULL, 'Bengaluru', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-29 05:35:40', '2026-08-29 05:51:34'),
(3, 'Metro Mega Supermarket', 'vikram.9876573719@metromart.in', '9876573719', NULL, 'Bengaluru', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-29 05:36:06', '2026-08-29 06:35:11'),
(4, 'sagar', 'shaikhsahil61234@gmail.com', '7517039055', NULL, 'Aurangabad', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-29 05:37:52', '2026-08-29 05:53:03'),
(5, 'Quick Pick Groceries', 'anil.9876566161@quickpick.in', '9876566161', NULL, 'Pune', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-29 05:45:50', '2026-08-29 05:45:50'),
(6, 'Quick Pick Groceries', 'anil.9876588983@quickpick.in', '9876588983', NULL, 'Pune', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-29 05:48:16', '2026-08-29 05:48:16'),
(7, 'Quick Pick Groceries', 'anil.9876557859@quickpick.in', '9876557859', NULL, 'Pune', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-29 05:49:27', '2026-08-29 05:49:27'),
(8, 'Metro Mega Supermarket', 'vikram.9876511952@metromart.in', '9876511952', NULL, 'Bengaluru', NULL, NULL, NULL, NULL, NULL, 1, '2026-08-29 05:49:39', '2026-08-29 05:49:39');

-- --------------------------------------------------------

--
-- Table structure for table `company_subscriptions`
--

CREATE TABLE `company_subscriptions` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_cycle` enum('monthly','yearly') DEFAULT 'monthly',
  `status` enum('active','trial','expired','cancelled') DEFAULT 'active',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `next_billing_date` datetime DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT 0.00,
  `payment_method` varchar(50) DEFAULT 'UPI',
  `transaction_id` varchar(100) DEFAULT NULL,
  `auto_renew` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_subscriptions`
--

INSERT INTO `company_subscriptions` (`id`, `company_id`, `plan_id`, `billing_cycle`, `status`, `start_date`, `end_date`, `next_billing_date`, `amount_paid`, `payment_method`, `transaction_id`, `auto_renew`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'yearly', 'active', '2026-08-29 05:49:47', '2027-08-29 05:49:47', '2027-08-29 05:49:47', 19190.00, 'UPI', 'TXN-82587786', 1, '2026-08-29 05:28:18', '2026-08-29 05:49:47'),
(4, 4, 2, 'monthly', 'active', '2026-08-29 05:53:03', '2026-09-28 05:53:03', '2026-09-28 05:53:03', 999.00, 'UPI', 'ORD-81872980', 1, '2026-08-29 05:37:52', '2026-08-29 05:53:03'),
(5, 5, 1, 'monthly', 'active', '2026-08-29 05:45:50', '2026-09-28 05:45:50', '2026-09-28 05:45:50', 499.00, 'UPI', 'ORD-82350733', 1, '2026-08-29 05:45:50', '2026-08-29 05:45:50'),
(6, 6, 1, 'monthly', 'active', '2026-08-29 05:48:16', '2026-09-28 05:48:16', '2026-09-28 05:48:16', 499.00, 'UPI', 'ORD-82496705', 1, '2026-08-29 05:48:16', '2026-08-29 05:48:16'),
(7, 7, 1, 'monthly', 'active', '2026-08-29 05:49:27', '2026-09-28 05:49:27', '2026-09-28 05:49:27', 499.00, 'UPI', 'ORD-82567382', 1, '2026-08-29 05:49:27', '2026-08-29 05:49:27'),
(8, 8, 2, 'yearly', 'active', '2026-08-29 05:49:39', '2027-09-28 05:49:39', '2027-09-28 05:49:39', 9590.00, 'UPI', 'ORD-82579726', 1, '2026-08-29 05:49:39', '2026-08-29 05:49:39');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `credit_limit` decimal(15,2) DEFAULT 0.00,
  `credit_used` decimal(15,2) DEFAULT 0.00,
  `outstanding_amount` decimal(15,2) DEFAULT 0.00,
  `customer_type` enum('retail','wholesale') DEFAULT 'retail',
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `company_id`, `name`, `phone`, `email`, `address`, `city`, `state`, `postal_code`, `gstin`, `credit_limit`, `credit_used`, `outstanding_amount`, `customer_type`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Sahil Shaikh', '8788946164', 'shaikhsahil61234@gmail.com', '', 'aurangabad', '', '', '', 0.00, 0.00, 0.00, 'wholesale', 1, '2026-08-17 06:33:13', '2026-08-17 06:48:09'),
(2, 1, 'taha khan', '8788946164', '', 'nmn', '', '', '', '', 0.00, 0.00, 0.00, 'retail', 1, '2026-08-27 08:31:47', '2026-08-27 08:31:47'),
(3, 1, 'sameer shaikh', '', 'sameer@gmail.com', '', 'Aurangabad (Chhatrapati Sambhajinagar)', 'Maharashtra', '431001', '', 0.00, 0.00, 0.00, 'retail', 1, '2026-08-28 03:21:24', '2026-08-28 03:36:07');

-- --------------------------------------------------------

--
-- Table structure for table `customer_ledger`
--

CREATE TABLE `customer_ledger` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `transaction_type` enum('sale','payment','return','credit_memo') NOT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `balance` decimal(15,2) DEFAULT NULL,
  `transaction_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `day_end_closing`
--

CREATE TABLE `day_end_closing` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `closing_date` date NOT NULL,
  `opening_cash` decimal(15,2) DEFAULT NULL,
  `cash_sales` decimal(15,2) DEFAULT NULL,
  `upi_sales` decimal(15,2) DEFAULT NULL,
  `card_sales` decimal(15,2) DEFAULT NULL,
  `total_expenses` decimal(15,2) DEFAULT NULL,
  `cash_withdrawal` decimal(15,2) DEFAULT NULL,
  `expected_cash` decimal(15,2) DEFAULT NULL,
  `actual_cash` decimal(15,2) DEFAULT NULL,
  `cash_difference` decimal(15,2) DEFAULT NULL,
  `status` enum('open','closed','verified') DEFAULT 'open',
  `notes` text DEFAULT NULL,
  `closed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `day_end_closing`
--

INSERT INTO `day_end_closing` (`id`, `company_id`, `closing_date`, `opening_cash`, `cash_sales`, `upi_sales`, `card_sales`, `total_expenses`, `cash_withdrawal`, `expected_cash`, `actual_cash`, `cash_difference`, `status`, `notes`, `closed_by`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-08-26', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 740.00, 0.00, 0.00, '', NULL, 1, '2026-08-27 08:39:29', '2026-08-27 08:39:29'),
(2, 1, '2026-08-27', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'open', NULL, 1, '2026-08-27 08:40:47', '2026-08-27 08:40:47'),
(4, 1, '2026-08-28', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'open', NULL, 1, '2026-08-28 04:03:40', '2026-08-28 04:03:40'),
(5, 1, '2026-08-29', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'open', NULL, 1, '2026-08-29 03:17:50', '2026-08-29 03:17:50');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `expense_category` enum('rent','electricity','salary','transport','maintenance','other') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `payment_mode_id` int(11) DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `transaction_type` enum('purchase_payment','sales_payment','customer_payment','supplier_payment') NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `customer_supplier_id` int(11) DEFAULT NULL,
  `payment_mode_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `company_id`, `transaction_type`, `transaction_id`, `customer_supplier_id`, `payment_mode_id`, `amount`, `reference_number`, `payment_date`, `notes`, `created_by`, `created_at`) VALUES
(1, 1, 'sales_payment', 3, NULL, 3, 133.50, NULL, '2026-08-27', NULL, 1, '2026-08-27 08:32:40'),
(2, 1, 'sales_payment', 4, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 08:39:29'),
(3, 1, 'sales_payment', 5, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 08:43:17'),
(4, 1, 'sales_payment', 6, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 08:43:31'),
(5, 1, 'sales_payment', 7, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 08:56:51'),
(6, 1, 'sales_payment', 8, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:02:40'),
(7, 1, 'sales_payment', 9, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:08:20'),
(8, 1, 'sales_payment', 10, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:11:25'),
(9, 1, 'sales_payment', 11, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:15:46'),
(10, 1, 'sales_payment', 12, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:20:36'),
(11, 1, 'sales_payment', 13, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:24:40'),
(12, 1, 'sales_payment', 14, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:29:14'),
(13, 1, 'sales_payment', 15, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:30:31'),
(14, 1, 'sales_payment', 16, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:32:55'),
(15, 1, 'sales_payment', 17, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:36:24'),
(16, 1, 'sales_payment', 18, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:38:38'),
(17, 1, 'sales_payment', 19, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:40:41'),
(18, 1, 'sales_payment', 20, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:42:05'),
(19, 1, 'sales_payment', 21, 1, 4, 66.25, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:42:51'),
(20, 1, 'sales_payment', 22, 1, 1, 240.00, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:44:38'),
(21, 1, 'sales_payment', 23, 2, 3, 251.99, NULL, '2026-08-27', NULL, 1, '2026-08-27 09:47:02'),
(22, 1, 'sales_payment', 24, 3, 3, 201.42, NULL, '2026-08-28', NULL, 1, '2026-08-28 03:22:34'),
(23, 1, 'sales_payment', 25, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 03:27:35'),
(24, 1, 'sales_payment', 26, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 03:34:40'),
(25, 1, 'sales_payment', 27, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 03:44:49'),
(26, 1, 'sales_payment', 28, 2, 1, 18.90, NULL, '2026-08-28', NULL, 1, '2026-08-28 03:46:45'),
(27, 1, 'sales_payment', 29, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 03:58:19'),
(28, 1, 'sales_payment', 30, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:02:36'),
(29, 1, 'sales_payment', 31, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:13:08'),
(30, 1, 'sales_payment', 32, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:16:07'),
(31, 1, 'sales_payment', 33, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:22:19'),
(32, 1, 'sales_payment', 34, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:23:57'),
(33, 1, 'sales_payment', 35, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:27:12'),
(34, 1, 'sales_payment', 36, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:35:21'),
(35, 1, 'sales_payment', 37, 2, 1, 144.90, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:39:06'),
(36, 1, 'sales_payment', 38, 2, 1, 144.90, NULL, '2026-08-28', NULL, 1, '2026-08-28 04:39:52'),
(37, 1, 'sales_payment', 39, 1, 1, 77.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 05:20:49'),
(38, 1, 'sales_payment', 40, 3, 3, 126.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:22:09'),
(39, 1, 'sales_payment', 41, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:23:45'),
(40, 1, 'sales_payment', 42, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:28:09'),
(41, 1, 'sales_payment', 43, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:31:34'),
(42, 1, 'sales_payment', 44, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:33:42'),
(43, 1, 'sales_payment', 45, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:38:39'),
(44, 1, 'sales_payment', 46, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:39:37'),
(45, 1, 'sales_payment', 47, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:41:01'),
(46, 1, 'sales_payment', 48, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:45:50'),
(47, 1, 'sales_payment', 49, 1, 1, 240.00, NULL, '2026-08-28', NULL, 1, '2026-08-28 08:47:44'),
(48, 1, 'sales_payment', 50, 2, 3, 77.70, NULL, '2026-08-29', NULL, 1, '2026-08-29 03:24:11');

-- --------------------------------------------------------

--
-- Table structure for table `payment_modes`
--

CREATE TABLE `payment_modes` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_modes`
--

INSERT INTO `payment_modes` (`id`, `company_id`, `name`, `code`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Cash', 'CASH', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, 1, 'UPI', 'UPI', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(3, 1, 'Card', 'CARD', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(4, 1, 'Credit/Udhaar', 'CREDIT', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(5, 1, 'Cheque', 'CHEQUE', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `unit_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `tax_id` int(11) NOT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `min_stock_level` int(11) DEFAULT 10,
  `reorder_quantity` int(11) DEFAULT 50,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `company_id`, `category_id`, `brand_id`, `unit_id`, `name`, `description`, `sku`, `barcode`, `tax_id`, `purchase_price`, `selling_price`, `min_stock_level`, `reorder_quantity`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 1, 4, 1, 1, 'Basmati Rice', 'GSDFGRFGF', 'BSU001', '1234567890123', 2, 100.00, 120.00, 50, 20, 1, '2026-08-24 11:35:54', '2026-08-29 05:12:19'),
(17, 1, 1, 1, 1, 'Sugar', 'hghgfhgf', 'SU123', '12345678990', 2, 60.00, 65.00, 30, 20, 1, '2026-08-27 08:30:42', '2026-08-27 08:30:58'),
(18, 1, 1, NULL, 4, 'Eggs', NULL, NULL, NULL, 2, 7.00, 9.00, 5, 10, 1, '2026-08-28 03:06:23', '2026-08-28 03:06:23');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `purchase_number` varchar(50) NOT NULL,
  `purchase_date` datetime NOT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `invoice_date` datetime DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `tax_amount` decimal(15,2) DEFAULT NULL,
  `discount_amount` decimal(15,2) DEFAULT NULL,
  `grand_total` decimal(15,2) DEFAULT NULL,
  `payment_status` enum('pending','partial','paid') DEFAULT 'pending',
  `purchase_status` enum('draft','confirmed','received','cancelled') DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`id`, `company_id`, `supplier_id`, `purchase_number`, `purchase_date`, `invoice_number`, `invoice_date`, `total_amount`, `tax_amount`, `discount_amount`, `grand_total`, `payment_status`, `purchase_status`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'PO-2026-000001', '2026-08-28 00:00:00', '12', NULL, 5000.00, 250.00, 0.00, 5250.00, 'pending', 'confirmed', NULL, 1, '2026-08-28 08:36:38', '2026-08-28 08:36:38');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_details`
--

CREATE TABLE `purchase_details` (
  `id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `line_total` decimal(15,2) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `received_quantity` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_details`
--

INSERT INTO `purchase_details` (`id`, `purchase_id`, `product_id`, `quantity`, `unit_price`, `discount_percent`, `discount_amount`, `tax_amount`, `line_total`, `batch_number`, `expiry_date`, `received_quantity`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 50, 100.00, 2.00, 0.00, 250.00, 5250.00, NULL, NULL, 0, '2026-08-28 08:36:38', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_returns`
--

CREATE TABLE `purchase_returns` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `return_number` varchar(50) NOT NULL,
  `return_date` date NOT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `tax_amount` decimal(15,2) DEFAULT NULL,
  `return_reason` text DEFAULT NULL,
  `return_status` enum('pending','processed','cancelled') DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_return_details`
--

CREATE TABLE `purchase_return_details` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `reason_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'Administrator with full access', '[\"*\"]', 1, '0000-00-00 00:00:00', '2026-08-27 09:17:59'),
(2, 'manager', 'Manager with management access', '[\"dashboard.view\",\"pos.access\",\"sales.discount\",\"sales.view\",\"sales.print\",\"inventory.view\",\"inventory.adjust\",\"purchase.view\",\"purchase.create\",\"suppliers.manage\",\"returns.sales\",\"returns.purchases\",\"master.products\",\"master.categories_brands\",\"master.customers\",\"master.taxes_units\",\"expenses.view\",\"expenses.create\",\"dayend.view\",\"dayend.perform\",\"ledger.view\",\"reports.sales\",\"reports.purchases\",\"reports.inventory\",\"reports.financial\"]', 1, '0000-00-00 00:00:00', '2026-08-27 09:17:59'),
(3, 'cashier', 'Cashier for sales transactions', '[\"pos.access\",\"sales.view\",\"sales.print\",\"master.customers\",\"returns.sales\",\"dayend.view\",\"dayend.perform\"]', 1, '0000-00-00 00:00:00', '2026-08-27 09:17:59'),
(4, 'warehouse', 'Warehouse staff for inventory', '[\"inventory.view\",\"inventory.adjust\",\"purchase.view\",\"purchase.create\",\"returns.purchases\",\"reports.inventory\"]', 1, '0000-00-00 00:00:00', '2026-08-27 09:17:59'),
(5, 'accountant', 'Accountant for financial records', '[\"dashboard.view\",\"sales.view\",\"sales.print\",\"purchase.view\",\"expenses.view\",\"expenses.create\",\"dayend.view\",\"ledger.view\",\"reports.sales\",\"reports.purchases\",\"reports.inventory\",\"reports.financial\"]', 1, '0000-00-00 00:00:00', '2026-08-27 09:17:59');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `invoice_date` datetime NOT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `tax_amount` decimal(15,2) DEFAULT NULL,
  `discount_amount` decimal(15,2) DEFAULT NULL,
  `grand_total` decimal(15,2) DEFAULT NULL,
  `payment_status` enum('pending','partial','paid') DEFAULT 'paid',
  `sales_status` enum('draft','completed','cancelled') DEFAULT 'completed',
  `cashier_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `company_id`, `customer_id`, `invoice_number`, `invoice_date`, `total_amount`, `tax_amount`, `discount_amount`, `grand_total`, `payment_status`, `sales_status`, `cashier_id`, `notes`, `created_at`, `updated_at`) VALUES
(3, 1, NULL, 'INV-2026-000001', '2026-08-27 08:32:40', 130.00, 6.50, 3.00, 133.50, 'paid', 'completed', 1, NULL, '2026-08-27 08:32:40', '2026-08-27 08:32:40'),
(4, 1, 1, 'INV-TEST-1787819969762', '2026-08-27 08:39:29', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 08:39:29', '2026-08-27 08:39:29'),
(5, 1, 1, 'INV-TEST-1787820197019', '2026-08-27 08:43:17', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 08:43:17', '2026-08-27 08:43:17'),
(6, 1, 1, 'INV-TEST-1787820211766', '2026-08-27 08:43:31', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 08:43:31', '2026-08-27 08:43:31'),
(7, 1, 1, 'INV-TEST-1787821011218', '2026-08-27 08:56:51', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 08:56:51', '2026-08-27 08:56:51'),
(8, 1, 1, 'INV-TEST-1787821360105', '2026-08-27 09:02:40', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:02:40', '2026-08-27 09:02:40'),
(9, 1, 1, 'INV-TEST-1787821700579', '2026-08-27 09:08:20', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:08:20', '2026-08-27 09:08:20'),
(10, 1, 1, 'INV-TEST-1787821885152', '2026-08-27 09:11:25', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:11:25', '2026-08-27 09:11:25'),
(11, 1, 1, 'INV-TEST-1787822146345', '2026-08-27 09:15:46', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:15:46', '2026-08-27 09:15:46'),
(12, 1, 1, 'INV-TEST-1787822436125', '2026-08-27 09:20:36', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:20:36', '2026-08-27 09:20:36'),
(13, 1, 1, 'INV-TEST-1787822680958', '2026-08-27 09:24:40', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:24:40', '2026-08-27 09:24:40'),
(14, 1, 1, 'INV-TEST-1787822954010', '2026-08-27 09:29:14', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:29:14', '2026-08-27 09:29:14'),
(15, 1, 1, 'INV-TEST-1787823031787', '2026-08-27 09:30:31', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:30:31', '2026-08-27 09:30:31'),
(16, 1, 1, 'INV-TEST-1787823175874', '2026-08-27 09:32:55', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:32:55', '2026-08-27 09:32:55'),
(17, 1, 1, 'INV-TEST-1787823384525', '2026-08-27 09:36:24', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:36:24', '2026-08-27 09:36:24'),
(18, 1, 1, 'INV-TEST-1787823518086', '2026-08-27 09:38:38', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:38:38', '2026-08-27 09:38:38'),
(19, 1, 1, 'INV-TEST-1787823641027', '2026-08-27 09:40:41', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:40:41', '2026-08-27 09:40:41'),
(20, 1, 1, 'INV-TEST-1787823725689', '2026-08-27 09:42:05', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:42:05', '2026-08-27 09:42:05'),
(21, 1, 1, 'INV-2026-000021', '2026-08-27 09:42:51', 65.00, 3.25, 2.00, 66.25, 'paid', 'completed', 1, NULL, '2026-08-27 09:42:51', '2026-08-27 09:42:51'),
(22, 1, 1, 'INV-TEST-1787823878457', '2026-08-27 09:44:38', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-27 09:44:38', '2026-08-27 09:44:38'),
(23, 1, 2, 'INV-2026-000023', '2026-08-27 09:47:02', 240.00, 12.00, 0.01, 251.99, 'paid', 'completed', 1, NULL, '2026-08-27 09:47:02', '2026-08-27 09:47:02'),
(24, 1, 3, 'INV-2026-000024', '2026-08-28 03:22:34', 194.00, 9.70, 2.28, 201.42, 'paid', 'completed', 1, NULL, '2026-08-28 03:22:34', '2026-08-28 03:22:34'),
(25, 1, 1, 'INV-TEST-1787887655282', '2026-08-28 03:27:35', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 03:27:35', '2026-08-28 03:27:35'),
(26, 1, 1, 'INV-TEST-1787888080529', '2026-08-28 03:34:40', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 03:34:40', '2026-08-28 03:34:40'),
(27, 1, 1, 'INV-TEST-1787888689720', '2026-08-28 03:44:49', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 03:44:49', '2026-08-28 03:44:49'),
(28, 1, 2, 'INV-2026-000028', '2026-08-28 03:46:45', 18.00, 0.90, 0.00, 18.90, 'paid', 'completed', 1, NULL, '2026-08-28 03:46:45', '2026-08-28 03:46:45'),
(29, 1, 1, 'INV-TEST-1787889499356', '2026-08-28 03:58:19', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 03:58:19', '2026-08-28 03:58:19'),
(30, 1, 1, 'INV-TEST-1787889755993', '2026-08-28 04:02:35', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 04:02:35', '2026-08-28 04:02:35'),
(31, 1, 1, 'INV-TEST-1787890388453', '2026-08-28 04:13:08', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 04:13:08', '2026-08-28 04:13:08'),
(32, 1, 1, 'INV-TEST-1787890566981', '2026-08-28 04:16:06', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 04:16:06', '2026-08-28 04:16:06'),
(33, 1, 1, 'INV-TEST-1787890939065', '2026-08-28 04:22:19', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 04:22:19', '2026-08-28 04:22:19'),
(34, 1, 1, 'INV-TEST-1787891037007', '2026-08-28 04:23:57', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 04:23:57', '2026-08-28 04:23:57'),
(35, 1, 1, 'INV-TEST-1787891232899', '2026-08-28 04:27:12', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 04:27:12', '2026-08-28 04:27:12'),
(36, 1, 1, 'INV-TEST-1787891721594', '2026-08-28 04:35:21', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 04:35:21', '2026-08-28 04:35:21'),
(37, 1, 2, 'INV-2026-000037', '2026-08-28 04:39:06', 138.00, 6.90, 0.00, 144.90, 'paid', 'completed', 1, NULL, '2026-08-28 04:39:06', '2026-08-28 04:39:06'),
(38, 1, 2, 'INV-2026-000038', '2026-08-28 04:39:52', 138.00, 6.90, 0.00, 144.90, 'paid', 'completed', 1, NULL, '2026-08-28 04:39:52', '2026-08-28 04:39:52'),
(39, 1, 1, 'INV-2026-000039', '2026-08-28 05:20:49', 74.00, 3.70, 0.70, 77.00, 'paid', 'completed', 1, NULL, '2026-08-28 05:20:49', '2026-08-28 05:20:49'),
(40, 1, 3, 'INV-2026-000040', '2026-08-28 08:22:09', 120.00, 6.00, 0.00, 126.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:22:09', '2026-08-28 08:22:09'),
(41, 1, 1, 'INV-TEST-1787905425256', '2026-08-28 08:23:45', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:23:45', '2026-08-28 08:23:45'),
(42, 1, 1, 'INV-TEST-1787905689460', '2026-08-28 08:28:09', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:28:09', '2026-08-28 08:28:09'),
(43, 1, 1, 'INV-TEST-1787905894405', '2026-08-28 08:31:34', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:31:34', '2026-08-28 08:31:34'),
(44, 1, 1, 'INV-TEST-1787906022090', '2026-08-28 08:33:42', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:33:42', '2026-08-28 08:33:42'),
(45, 1, 1, 'INV-TEST-1787906319345', '2026-08-28 08:38:39', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:38:39', '2026-08-28 08:38:39'),
(46, 1, 1, 'INV-TEST-1787906377511', '2026-08-28 08:39:37', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:39:37', '2026-08-28 08:39:37'),
(47, 1, 1, 'INV-TEST-1787906461769', '2026-08-28 08:41:01', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:41:01', '2026-08-28 08:41:01'),
(48, 1, 1, 'INV-TEST-1787906750499', '2026-08-28 08:45:50', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:45:50', '2026-08-28 08:45:50'),
(49, 1, 1, 'INV-TEST-1787906864533', '2026-08-28 08:47:44', 240.00, 0.00, 0.00, 240.00, 'paid', 'completed', 1, NULL, '2026-08-28 08:47:44', '2026-08-28 08:47:44'),
(50, 1, 2, 'INV-2026-000050', '2026-08-29 03:24:11', 74.00, 3.70, 0.00, 77.70, 'paid', 'completed', 1, NULL, '2026-08-29 03:24:11', '2026-08-29 03:24:11');

-- --------------------------------------------------------

--
-- Table structure for table `sales_details`
--

CREATE TABLE `sales_details` (
  `id` int(11) NOT NULL,
  `sales_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `line_total` decimal(15,2) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_details`
--

INSERT INTO `sales_details` (`id`, `sales_id`, `product_id`, `quantity`, `unit_price`, `discount_percent`, `discount_amount`, `tax_amount`, `line_total`, `batch_number`, `created_at`, `updated_at`) VALUES
(3, 3, 17, 2, 65.00, 0.00, 0.00, 6.50, 136.50, NULL, '2026-08-27 08:32:40', '0000-00-00 00:00:00'),
(4, 4, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 08:39:29', '0000-00-00 00:00:00'),
(5, 5, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 08:43:17', '0000-00-00 00:00:00'),
(6, 6, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 08:43:31', '0000-00-00 00:00:00'),
(7, 7, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 08:56:51', '0000-00-00 00:00:00'),
(8, 8, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:02:40', '0000-00-00 00:00:00'),
(9, 9, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:08:20', '0000-00-00 00:00:00'),
(10, 10, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:11:25', '0000-00-00 00:00:00'),
(11, 11, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:15:46', '0000-00-00 00:00:00'),
(12, 12, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:20:36', '0000-00-00 00:00:00'),
(13, 13, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:24:40', '0000-00-00 00:00:00'),
(14, 14, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:29:14', '0000-00-00 00:00:00'),
(15, 15, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:30:31', '0000-00-00 00:00:00'),
(16, 16, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:32:55', '0000-00-00 00:00:00'),
(17, 17, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:36:24', '0000-00-00 00:00:00'),
(18, 18, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:38:38', '0000-00-00 00:00:00'),
(19, 19, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:40:41', '0000-00-00 00:00:00'),
(20, 20, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:42:05', '0000-00-00 00:00:00'),
(21, 21, 17, 1, 65.00, 0.00, 0.00, 3.25, 68.25, NULL, '2026-08-27 09:42:51', '0000-00-00 00:00:00'),
(22, 22, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-27 09:44:38', '0000-00-00 00:00:00'),
(23, 23, 3, 2, 120.00, 0.00, 0.00, 12.00, 252.00, NULL, '2026-08-27 09:47:02', '0000-00-00 00:00:00'),
(24, 24, 18, 1, 9.00, 0.00, 0.00, 0.45, 9.45, NULL, '2026-08-28 03:22:34', '0000-00-00 00:00:00'),
(25, 24, 17, 1, 65.00, 0.00, 0.00, 3.25, 68.25, NULL, '2026-08-28 03:22:34', '0000-00-00 00:00:00'),
(26, 24, 3, 1, 120.00, 0.00, 0.00, 6.00, 126.00, NULL, '2026-08-28 03:22:34', '0000-00-00 00:00:00'),
(27, 25, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 03:27:35', '0000-00-00 00:00:00'),
(28, 26, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 03:34:40', '0000-00-00 00:00:00'),
(29, 27, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 03:44:49', '0000-00-00 00:00:00'),
(30, 28, 18, 2, 9.00, 0.00, 0.00, 0.90, 18.90, NULL, '2026-08-28 03:46:45', '0000-00-00 00:00:00'),
(31, 29, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 03:58:19', '0000-00-00 00:00:00'),
(32, 30, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 04:02:36', '0000-00-00 00:00:00'),
(33, 31, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 04:13:08', '0000-00-00 00:00:00'),
(34, 32, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 04:16:06', '0000-00-00 00:00:00'),
(35, 33, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 04:22:19', '0000-00-00 00:00:00'),
(36, 34, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 04:23:57', '0000-00-00 00:00:00'),
(37, 35, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 04:27:12', '0000-00-00 00:00:00'),
(38, 36, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 04:35:21', '0000-00-00 00:00:00'),
(39, 37, 18, 2, 9.00, 0.00, 0.00, 0.90, 18.90, NULL, '2026-08-28 04:39:06', '0000-00-00 00:00:00'),
(40, 37, 3, 1, 120.00, 0.00, 0.00, 6.00, 126.00, NULL, '2026-08-28 04:39:06', '0000-00-00 00:00:00'),
(41, 38, 18, 2, 9.00, 0.00, 0.00, 0.90, 18.90, NULL, '2026-08-28 04:39:52', '0000-00-00 00:00:00'),
(42, 38, 3, 1, 120.00, 0.00, 0.00, 6.00, 126.00, NULL, '2026-08-28 04:39:52', '0000-00-00 00:00:00'),
(43, 39, 18, 1, 9.00, 0.00, 0.00, 0.45, 9.45, NULL, '2026-08-28 05:20:49', '0000-00-00 00:00:00'),
(44, 39, 17, 1, 65.00, 0.00, 0.00, 3.25, 68.25, NULL, '2026-08-28 05:20:49', '0000-00-00 00:00:00'),
(45, 40, 3, 1, 120.00, 0.00, 0.00, 6.00, 126.00, NULL, '2026-08-28 08:22:09', '0000-00-00 00:00:00'),
(46, 41, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:23:45', '0000-00-00 00:00:00'),
(47, 42, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:28:09', '0000-00-00 00:00:00'),
(48, 43, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:31:34', '0000-00-00 00:00:00'),
(49, 44, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:33:42', '0000-00-00 00:00:00'),
(50, 45, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:38:39', '0000-00-00 00:00:00'),
(51, 46, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:39:37', '0000-00-00 00:00:00'),
(52, 47, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:41:01', '0000-00-00 00:00:00'),
(53, 48, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:45:50', '0000-00-00 00:00:00'),
(54, 49, 3, 2, 120.00, 0.00, 0.00, 0.00, 240.00, 'BATCH-TEST-001', '2026-08-28 08:47:44', '0000-00-00 00:00:00'),
(55, 50, 18, 1, 9.00, 0.00, 0.00, 0.45, 9.45, NULL, '2026-08-29 03:24:11', '0000-00-00 00:00:00'),
(56, 50, 17, 1, 65.00, 0.00, 0.00, 3.25, 68.25, NULL, '2026-08-29 03:24:11', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `sales_returns`
--

CREATE TABLE `sales_returns` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `sales_id` int(11) NOT NULL,
  `return_number` varchar(50) NOT NULL,
  `return_date` date NOT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `tax_amount` decimal(15,2) DEFAULT NULL,
  `return_reason` text DEFAULT NULL,
  `return_status` enum('pending','processed','cancelled') DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_return_details`
--

CREATE TABLE `sales_return_details` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `reason_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('-bG4dKdsnYBr5uyUJfygoqY9Wl1RGfvm', 1788068793, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:46:32.620Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('0RJeSn2r_TGYydM3qytbKea6q5mKKf9g', 1788068897, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:48:16.599Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('1CF_Qz8qgHSYF8Qf2CdqxUioSniCLpGJ', 1788062278, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T03:57:58.310Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('3zMxgKyjpLeXqsuPw1QZNMq0FjwgflKe', 1788068336, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T02:53:53.076Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('4IJfTDC2zEVnv-zAARMRepZLGxeAKii5', 1788062996, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T04:09:55.953Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"loginOtp\":{\"phone\":\"9999999999\",\"otp\":\"708594\",\"userId\":1,\"expiresAt\":1787976895940,\"attempts\":0}}'),
('4LVtu_9SYh3BJHo41xmHrMyp78NwRA55', 1788068967, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:49:27.199Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('4NBEXGwG7LMXP388a_-bqrzb2Q24XZsr', 1788067737, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:28:57.116Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('61qKJozOCLwPpl6qcN--viq0rxFsAPHA', 1788058884, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T03:01:24.315Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('8CkrfjW_gTOUXLM7v6ICi9cKhhtArdGG', 1788068980, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:49:39.790Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('8dcsqiezCS7ofeIqxSIwzlSvtF5h4XWG', 1788068833, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:47:12.761Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('CinATyZxUVnKp4NQRi0i-W1ax92-bPQY', 1788067158, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:19:17.839Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('E4Cex236nMH32YBlKhtCBDFpxQZ5qb3X', 1788068141, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:35:40.675Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":7,\"username\":\"9876512857\",\"role\":\"admin\",\"companyId\":2}'),
('JEtNyNIJveUZwZibDeLxykLnfFiZ-xgb', 1788059778, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T03:16:17.544Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":2,\"username\":\"taha\",\"role\":\"cashier\",\"companyId\":1}'),
('KBQE8DFPbL0exywxxGpmifjBTp4esTfk', 1788073626, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T06:55:51.017Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('M0DaTgsWhWIAw7EpY3jXuwJiEsAnM9uP', 1788068775, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:46:15.267Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('MHPs2VAG01piF3pqOPYS5kjkqVpOKnKW', 1788068968, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:49:27.434Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":12,\"username\":\"9876557859\",\"role\":\"admin\",\"companyId\":7}'),
('MhkH3FrztPcsNw5PUJAJkIQIvgfJAW7J', 1788071770, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:50:21.398Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('SFmJQse6V7PZ3TwnADxHoZMRlC4pZHEy', 1788068806, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:46:46.289Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('ThNalwo4nd0KvS-kK-cWOw1OvDq46Z8o', 1788068167, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:36:07.096Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":8,\"username\":\"9876573719\",\"role\":\"admin\",\"companyId\":3}'),
('U5YNN-5BaJcwlEUR1NBRJzkHGvijWAVQ', 1788059776, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T03:16:15.594Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('V-isc2hmtPHNP6kjsqlEJndTubLAxirp', 1788063012, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T04:10:11.998Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('VKsY3cqMjUz8tIxIISXH3pgjisrDnqR6', 1788062278, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T03:57:58.325Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":2,\"username\":\"taha\",\"role\":\"cashier\",\"companyId\":1}'),
('WebMEXS0YxwMVjZiPape8IF2A5UWQbcW', 1788068897, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:48:16.761Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":11,\"username\":\"9876588983\",\"role\":\"admin\",\"companyId\":6}'),
('WgKAS7AWZsigKP3jOuBk1aW5TZ4J6L8e', 1788063051, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T04:10:46.878Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('XvxneLodv-l5FMRrO3BMS9sgCYQtk8_u', 1788068787, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:46:27.287Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('ZFYV4qkOPdYN73gGvy18TXwnwOzxrR8n', 1788058887, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T03:01:26.860Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('Zy-27emhj9wJbj3Uq4WZMKRt5VHkq7F0', 1788059774, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T03:16:13.625Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('gdqkn6_Tf_HFLctwwNXgnnaU6YpL2mmf', 1788068167, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:36:07.002Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('jywKZbbDDR6DWhzbxMD0lee1s27cj0uN', 1788068988, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:49:47.699Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('kwKobVuQnPWJNgF6RxkPcHOXOr89o3bo', 1788066600, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:09:59.443Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('uMHHnptjL6F6NkT4rLQKdixnBlGKTM05', 1788068980, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:49:39.849Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":13,\"username\":\"9876511952\",\"role\":\"admin\",\"companyId\":8}'),
('v4Rqb5xH7oJgBxJDgNcWlFZ5Bdj33UxU', 1788068141, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:35:40.573Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('vNu3tqrdmfXC8mjN2otfXZoCOO5Pmm5p', 1788068173, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:36:12.485Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('wF84FLDtn6GjuEZReb4dHEuJganZKsDn', 1788066114, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:01:54.051Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('wK1X_oOkZfarVt3AJUuGDZqVvGnddKLy', 1788068800, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:46:40.209Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('wdGDJlGj-YfTtW71QjzYxmyU8d_5tP4N', 1788068751, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:45:50.599Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('y0Qb7JVMNquWMGW8n_oXDi8AsF8Iiax3', 1788068941, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:49:01.305Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"admin\",\"role\":\"admin\",\"companyId\":1}'),
('zQEiTDgLFn-D4_7FjOKwTyZfl-04ocVM', 1788068751, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-08-30T05:45:50.804Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":10,\"username\":\"9876566161\",\"role\":\"admin\",\"companyId\":5}');

-- --------------------------------------------------------

--
-- Table structure for table `smtp_settings`
--

CREATE TABLE `smtp_settings` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 0,
  `host` varchar(255) DEFAULT NULL,
  `port` int(11) DEFAULT 587,
  `from_email` varchar(255) DEFAULT NULL,
  `from_name` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `use_ssl` tinyint(1) DEFAULT 0,
  `require_auth` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `smtp_settings`
--

INSERT INTO `smtp_settings` (`id`, `company_id`, `is_enabled`, `host`, `port`, `from_email`, `from_name`, `username`, `password`, `use_ssl`, `require_auth`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'smtp.gmail.com', 587, 'billing@samplestore.com', 'Sample Store POS', NULL, 'testpassword123', 0, 1, '2026-08-29 04:58:36', '2026-08-29 05:00:17'),
(2, 4, 0, '', 587, 'shaikhsahil61234@gmail.com', 'sagar', NULL, '', 0, 1, '2026-08-29 05:43:59', '2026-08-29 05:43:59');

-- --------------------------------------------------------

--
-- Table structure for table `stock`
--

CREATE TABLE `stock` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 0,
  `value` decimal(15,2) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `location_rack` varchar(50) DEFAULT NULL,
  `reorder_flag` tinyint(4) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock`
--

INSERT INTO `stock` (`id`, `company_id`, `product_id`, `quantity`, `value`, `batch_number`, `expiry_date`, `location_rack`, `reorder_flag`, `created_at`, `updated_at`) VALUES
(5, 1, 17, 94, 5610.00, 'BATCH-001', NULL, NULL, 0, '2026-08-27 08:30:42', '2026-08-29 03:24:11'),
(6, 1, 3, 44, 0.00, 'BATCH-TEST-001', NULL, NULL, 0, '2026-08-27 08:39:29', '2026-08-28 08:22:09'),
(7, 1, 18, 91, 619.00, 'BATCH-001', NULL, NULL, 0, '2026-08-28 03:06:23', '2026-08-29 03:24:11');

-- --------------------------------------------------------

--
-- Table structure for table `stock_ledger`
--

CREATE TABLE `stock_ledger` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `transaction_type` enum('in','out','adjustment','transfer','damage') NOT NULL,
  `quantity` int(11) NOT NULL,
  `opening_stock` int(11) DEFAULT NULL,
  `closing_stock` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_ledger`
--

INSERT INTO `stock_ledger` (`id`, `company_id`, `product_id`, `transaction_type`, `quantity`, `opening_stock`, `closing_stock`, `reference_type`, `reference_id`, `batch_number`, `expiry_date`, `notes`, `created_by`, `created_at`) VALUES
(3, 1, 17, 'out', 2, 100, 98, 'sale', 3, NULL, NULL, NULL, 1, '2026-08-27 08:32:40'),
(4, 1, 3, 'out', 2, 50, 48, 'sale', 4, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 08:39:29'),
(5, 1, 3, 'out', 2, 50, 48, 'sale', 5, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 08:43:17'),
(6, 1, 3, 'out', 2, 50, 48, 'sale', 6, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 08:43:31'),
(7, 1, 3, 'out', 2, 50, 48, 'sale', 7, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 08:56:51'),
(8, 1, 3, 'out', 2, 50, 48, 'sale', 8, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:02:40'),
(9, 1, 3, 'out', 2, 50, 48, 'sale', 9, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:08:20'),
(10, 1, 3, 'out', 2, 50, 48, 'sale', 10, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:11:25'),
(11, 1, 3, 'out', 2, 50, 48, 'sale', 11, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:15:46'),
(12, 1, 3, 'out', 2, 50, 48, 'sale', 12, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:20:36'),
(13, 1, 3, 'out', 2, 50, 48, 'sale', 13, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:24:40'),
(14, 1, 3, 'out', 2, 50, 48, 'sale', 14, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:29:14'),
(15, 1, 3, 'out', 2, 50, 48, 'sale', 15, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:30:31'),
(16, 1, 3, 'out', 2, 50, 48, 'sale', 16, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:32:55'),
(17, 1, 3, 'out', 2, 50, 48, 'sale', 17, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:36:24'),
(18, 1, 3, 'out', 2, 50, 48, 'sale', 18, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:38:38'),
(19, 1, 3, 'out', 2, 50, 48, 'sale', 19, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:40:41'),
(20, 1, 3, 'out', 2, 50, 48, 'sale', 20, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:42:05'),
(21, 1, 17, 'out', 1, 98, 97, 'sale', 21, NULL, NULL, NULL, 1, '2026-08-27 09:42:51'),
(22, 1, 3, 'out', 2, 50, 48, 'sale', 22, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-27 09:44:38'),
(23, 1, 3, 'out', 2, 50, 48, 'sale', 23, NULL, NULL, NULL, 1, '2026-08-27 09:47:02'),
(24, 1, 18, 'out', 1, 100, 99, 'sale', 24, NULL, NULL, NULL, 1, '2026-08-28 03:22:34'),
(25, 1, 17, 'out', 1, 97, 96, 'sale', 24, NULL, NULL, NULL, 1, '2026-08-28 03:22:34'),
(26, 1, 3, 'out', 1, 48, 47, 'sale', 24, NULL, NULL, NULL, 1, '2026-08-28 03:22:34'),
(27, 1, 3, 'out', 2, 47, 45, 'sale', 25, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 03:27:35'),
(28, 1, 3, 'out', 2, 47, 45, 'sale', 26, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 03:34:40'),
(29, 1, 3, 'out', 2, 47, 45, 'sale', 27, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 03:44:49'),
(30, 1, 18, 'out', 2, 99, 97, 'sale', 28, NULL, NULL, NULL, 1, '2026-08-28 03:46:45'),
(31, 1, 3, 'out', 2, 47, 45, 'sale', 29, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 03:58:19'),
(32, 1, 3, 'out', 2, 47, 45, 'sale', 30, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 04:02:36'),
(33, 1, 3, 'out', 2, 47, 45, 'sale', 31, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 04:13:08'),
(34, 1, 3, 'out', 2, 47, 45, 'sale', 32, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 04:16:06'),
(35, 1, 3, 'out', 2, 47, 45, 'sale', 33, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 04:22:19'),
(36, 1, 3, 'out', 2, 47, 45, 'sale', 34, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 04:23:57'),
(37, 1, 3, 'out', 2, 47, 45, 'sale', 35, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 04:27:12'),
(38, 1, 3, 'out', 2, 47, 45, 'sale', 36, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 04:35:21'),
(39, 1, 18, 'out', 2, 97, 95, 'sale', 37, NULL, NULL, NULL, 1, '2026-08-28 04:39:06'),
(40, 1, 3, 'out', 1, 47, 46, 'sale', 37, NULL, NULL, NULL, 1, '2026-08-28 04:39:06'),
(41, 1, 18, 'out', 2, 95, 93, 'sale', 38, NULL, NULL, NULL, 1, '2026-08-28 04:39:52'),
(42, 1, 3, 'out', 1, 46, 45, 'sale', 38, NULL, NULL, NULL, 1, '2026-08-28 04:39:52'),
(43, 1, 18, 'out', 1, 93, 92, 'sale', 39, NULL, NULL, NULL, 1, '2026-08-28 05:20:49'),
(44, 1, 17, 'out', 1, 96, 95, 'sale', 39, NULL, NULL, NULL, 1, '2026-08-28 05:20:49'),
(45, 1, 3, 'out', 1, 45, 44, 'sale', 40, NULL, NULL, NULL, 1, '2026-08-28 08:22:09'),
(46, 1, 3, 'out', 2, 44, 42, 'sale', 41, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:23:45'),
(47, 1, 3, 'out', 2, 44, 42, 'sale', 42, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:28:09'),
(48, 1, 3, 'out', 2, 44, 42, 'sale', 43, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:31:34'),
(49, 1, 3, 'out', 2, 44, 42, 'sale', 44, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:33:42'),
(50, 1, 3, 'out', 2, 44, 42, 'sale', 45, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:38:39'),
(51, 1, 3, 'out', 2, 44, 42, 'sale', 46, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:39:37'),
(52, 1, 3, 'out', 2, 44, 42, 'sale', 47, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:41:01'),
(53, 1, 3, 'out', 2, 44, 42, 'sale', 48, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:45:50'),
(54, 1, 3, 'out', 2, 44, 42, 'sale', 49, 'BATCH-TEST-001', NULL, NULL, 1, '2026-08-28 08:47:44'),
(55, 1, 18, 'out', 1, 92, 91, 'sale', 50, NULL, NULL, NULL, 1, '2026-08-29 03:24:11'),
(56, 1, 17, 'out', 1, 95, 94, 'sale', 50, NULL, NULL, NULL, 1, '2026-08-29 03:24:11');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `price_monthly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_yearly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) DEFAULT '₹',
  `max_users` int(11) DEFAULT 2,
  `max_products` int(11) DEFAULT 500,
  `max_invoices_per_month` int(11) DEFAULT 1000,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `badge_text` varchar(50) DEFAULT NULL,
  `is_popular` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `code`, `description`, `price_monthly`, `price_yearly`, `currency`, `max_users`, `max_products`, `max_invoices_per_month`, `features`, `badge_text`, `is_popular`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Starter Retailer', 'starter', 'Essential billing and inventory tools for small grocery shops and single counters.', 499.00, 4790.00, '₹', 2, 1000, 2000, '[\"Single Counter Quick POS Billing\",\"Barcode & Thermal 80mm Printing\",\"Standard A4 Invoicing & GST Matrix\",\"Product & Category Catalog (1,000 items)\",\"Daily Sales Reports & Summaries\",\"Basic Email Receipts via SMTP\"]', 'ESSENTIALS', 0, 1, '2026-08-29 05:27:37', '2026-08-29 05:27:37'),
(2, 'Professional Store', 'pro', 'Comprehensive ERP with multi-cart POS, automated SMTP, and inventory control.', 999.00, 9590.00, '₹', 6, 10000, 15000, '[\"Multi-Level & Multi-Cart POS Terminal\",\"High-Speed Barcode Scanning & Audio Feedback\",\"Automated SMTP Email Dispatch & Presets\",\"Custom Logo Branding on Invoices & POS\",\"Day-End Cash Reconciliation & Register Audits\",\"Stock Ledger, Reorder Alerts & Purchase Tracking\",\"Full Customer & Supplier Ledger Accounting\",\"Priority Email & Chat Support\"]', 'MOST POPULAR', 1, 1, '2026-08-29 05:27:37', '2026-08-29 05:27:37'),
(3, 'Enterprise Supermarket', 'enterprise', 'Unlimited capacity for multi-counter supermarkets and enterprise retail chains.', 1999.00, 19190.00, '₹', 999, 999999, 999999, '[\"Unlimited Users, Counters & Cashiers\",\"Unlimited Products & Invoices per month\",\"Role Privileges & Granular Access Control\",\"Multi-Branch & Warehouse Stock Transfers\",\"Advanced Sales Analytics & Profit Margins\",\"Custom Domain & Dedicated Support Manager\",\"Automated Cloud Backups & Zero Downtime SLA\"]', 'UNLIMITED', 0, 1, '2026-08-29 05:27:37', '2026-08-29 05:27:37');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account` varchar(50) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `payment_terms` text DEFAULT NULL,
  `outstanding_amount` decimal(15,2) DEFAULT 0.00,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `company_id`, `name`, `phone`, `email`, `address`, `city`, `state`, `postal_code`, `gstin`, `pan`, `bank_name`, `bank_account`, `ifsc_code`, `payment_terms`, `outstanding_amount`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'edward', '8788946164', 'shaikhsahil61234@gmail.com', 'dfdsf', 'Malegaon', 'Maharashtra', '431001', '', '', '', '', '', '', 0.00, 1, '2026-08-17 06:41:54', '2026-08-28 05:22:15');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_ledger`
--

CREATE TABLE `supplier_ledger` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `transaction_type` enum('purchase','payment','return','debit_memo') NOT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `balance` decimal(15,2) DEFAULT NULL,
  `transaction_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `taxes`
--

CREATE TABLE `taxes` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `rate` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `taxes`
--

INSERT INTO `taxes` (`id`, `company_id`, `name`, `rate`, `description`, `tax_code`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'No Tax', 0.00, NULL, 'NO_TAX', 1, '0000-00-00 00:00:00', '2026-08-28 03:36:56'),
(2, 1, 'GST 5%', 5.00, NULL, 'GST_5', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(3, 1, 'GST 12%', 12.00, NULL, 'GST_12', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(4, 1, 'GST 18%', 18.00, NULL, 'GST_18', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(5, 1, 'GST 28%', 28.00, NULL, 'GST_28', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `short_name` varchar(10) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `company_id`, `name`, `short_name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Kilogram', 'kg', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, 1, 'Liter', 'L', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(3, 1, 'Piece', 'pc', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(4, 1, 'Box', 'box', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(5, 1, 'Packet', 'pkt', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(6, 1, 'Dozen', 'dz', NULL, 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `company_id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role_id`, `is_active`, `last_login`, `created_at`, `updated_at`, `avatar`) VALUES
(1, 1, 'admin', 'admin@grocerybilling.com', '$2a$10$jOEpMrCESehTeTNJjV88iO4zHi.httqV8OXkpccM2e./z03YtsnNi', 'Admin', NULL, '9999999999', 1, 1, '2026-08-29 06:55:51', '0000-00-00 00:00:00', '2026-08-29 06:55:51', '/uploads/avatars/user-avatar-1-1787980864194.jpg'),
(2, 1, 'taha', 'taha61234@gmail.com', '$2a$10$10z.VP8sze85xCAs9nNxYeXeRL9bWjjfhs9noiL1Hvx49cYiHVZUC', 'taha', 'khan', '8788946164', 3, 1, '2026-08-29 04:34:20', '2026-08-27 07:56:02', '2026-08-29 04:34:20', NULL),
(7, 2, '9876512857', 'vikram.9876512857@metromart.in', NULL, 'Vikram Singh', NULL, '9876512857', 1, 1, '2026-08-29 05:35:40', '2026-08-29 05:35:40', '2026-08-29 05:51:34', NULL),
(8, 3, '9876573719', 'vikram.9876573719@metromart.in', NULL, 'Vikram Singh', NULL, '9876573719', 1, 1, '2026-08-29 05:36:07', '2026-08-29 05:36:06', '2026-08-29 06:35:11', NULL),
(9, 4, '7517039055', 'shaikhsahil61234@gmail.com', NULL, 'Sahil Shaikh', NULL, '7517039055', 1, 1, '2026-08-29 05:41:58', '2026-08-29 05:37:52', '2026-08-29 05:53:03', NULL),
(10, 5, '9876566161', 'anil.9876566161@quickpick.in', NULL, 'Anil Gupta', NULL, '9876566161', 1, 1, '2026-08-29 05:45:50', '2026-08-29 05:45:50', '2026-08-29 05:45:50', NULL),
(11, 6, '9876588983', 'anil.9876588983@quickpick.in', NULL, 'Anil Gupta', NULL, '9876588983', 1, 1, '2026-08-29 05:48:16', '2026-08-29 05:48:16', '2026-08-29 05:48:16', NULL),
(12, 7, '9876557859', 'anil.9876557859@quickpick.in', NULL, 'Anil Gupta', NULL, '9876557859', 1, 1, '2026-08-29 05:49:27', '2026-08-29 05:49:27', '2026-08-29 05:49:27', NULL),
(13, 8, '9876511952', 'vikram.9876511952@metromart.in', NULL, 'Vikram Singh', NULL, '9876511952', 1, 1, '2026-08-29 05:49:39', '2026-08-29 05:49:39', '2026-08-29 05:49:39', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `brands_company_id_name` (`company_id`,`name`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_company_id_name` (`company_id`,`name`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `plan_id` (`plan_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_name` (`name`),
  ADD KEY `idx_customers_comp_phone` (`company_id`,`phone`);

--
-- Indexes for table `customer_ledger`
--
ALTER TABLE `customer_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_date` (`transaction_date`),
  ADD KEY `customer_ledger_company_id_customer_id` (`company_id`,`customer_id`),
  ADD KEY `customer_ledger_transaction_date` (`transaction_date`);

--
-- Indexes for table `day_end_closing`
--
ALTER TABLE `day_end_closing`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_closing` (`company_id`,`closing_date`),
  ADD KEY `closed_by` (`closed_by`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `payment_mode_id` (`payment_mode_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `payment_mode_id` (`payment_mode_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `payment_modes`
--
ALTER TABLE `payment_modes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_modes_company_id_name` (`company_id`,`name`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `brand_id` (`brand_id`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `tax_id` (`tax_id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_product_sku` (`sku`),
  ADD KEY `idx_product_barcode` (`barcode`),
  ADD KEY `idx_products_comp_name` (`company_id`,`name`),
  ADD KEY `idx_products_barcode` (`barcode`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `purchases_company_id_purchase_number` (`company_id`,`purchase_number`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `purchases_purchase_date` (`purchase_date`),
  ADD KEY `idx_purchase_date` (`purchase_date`);

--
-- Indexes for table `purchase_details`
--
ALTER TABLE `purchase_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_id` (`purchase_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `purchase_returns`
--
ALTER TABLE `purchase_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_purchase_return` (`company_id`,`return_number`),
  ADD KEY `purchase_id` (`purchase_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `purchase_return_details`
--
ALTER TABLE `purchase_return_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sales_company_id_invoice_number` (`company_id`,`invoice_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `cashier_id` (`cashier_id`),
  ADD KEY `sales_invoice_date` (`invoice_date`),
  ADD KEY `idx_sales_date` (`invoice_date`),
  ADD KEY `idx_sales_comp_date` (`company_id`,`invoice_date`),
  ADD KEY `idx_sales_comp_status` (`company_id`,`payment_status`);

--
-- Indexes for table `sales_details`
--
ALTER TABLE `sales_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sales_id` (`sales_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `sales_returns`
--
ALTER TABLE `sales_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_return` (`company_id`,`return_number`),
  ADD KEY `sales_id` (`sales_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `sales_return_details`
--
ALTER TABLE `sales_return_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `smtp_settings`
--
ALTER TABLE `smtp_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stock_company_id_product_id_batch_number` (`company_id`,`product_id`,`batch_number`),
  ADD KEY `stock_product_id` (`product_id`),
  ADD KEY `idx_stock_product` (`product_id`),
  ADD KEY `idx_stock_comp_prod` (`company_id`,`product_id`);

--
-- Indexes for table `stock_ledger`
--
ALTER TABLE `stock_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `stock_ledger_created_at` (`created_at`),
  ADD KEY `stock_ledger_product_id` (`product_id`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `idx_supplier_name` (`name`);

--
-- Indexes for table `supplier_ledger`
--
ALTER TABLE `supplier_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_supplier` (`supplier_id`),
  ADD KEY `idx_date` (`transaction_date`),
  ADD KEY `supplier_ledger_company_id_supplier_id` (`company_id`,`supplier_id`);

--
-- Indexes for table `taxes`
--
ALTER TABLE `taxes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `taxes_company_id_name` (`company_id`,`name`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `units_company_id_name` (`company_id`,`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_user_phone` (`phone`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `customer_ledger`
--
ALTER TABLE `customer_ledger`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `day_end_closing`
--
ALTER TABLE `day_end_closing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `payment_modes`
--
ALTER TABLE `payment_modes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_details`
--
ALTER TABLE `purchase_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_returns`
--
ALTER TABLE `purchase_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_return_details`
--
ALTER TABLE `purchase_return_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `sales_details`
--
ALTER TABLE `sales_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `sales_returns`
--
ALTER TABLE `sales_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_return_details`
--
ALTER TABLE `sales_return_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `smtp_settings`
--
ALTER TABLE `smtp_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stock`
--
ALTER TABLE `stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `stock_ledger`
--
ALTER TABLE `stock_ledger`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `supplier_ledger`
--
ALTER TABLE `supplier_ledger`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `taxes`
--
ALTER TABLE `taxes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `brands`
--
ALTER TABLE `brands`
  ADD CONSTRAINT `brands_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  ADD CONSTRAINT `company_subscriptions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `company_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customer_ledger`
--
ALTER TABLE `customer_ledger`
  ADD CONSTRAINT `customer_ledger_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_ledger_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Constraints for table `day_end_closing`
--
ALTER TABLE `day_end_closing`
  ADD CONSTRAINT `day_end_closing_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `day_end_closing_ibfk_2` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`),
  ADD CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`),
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `payment_modes`
--
ALTER TABLE `payment_modes`
  ADD CONSTRAINT `payment_modes_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_3` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_4` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_5` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchases_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `purchase_details`
--
ALTER TABLE `purchase_details`
  ADD CONSTRAINT `purchase_details_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `purchase_returns`
--
ALTER TABLE `purchase_returns`
  ADD CONSTRAINT `purchase_returns_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_returns_ibfk_2` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`),
  ADD CONSTRAINT `purchase_returns_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `purchase_return_details`
--
ALTER TABLE `purchase_return_details`
  ADD CONSTRAINT `purchase_return_details_ibfk_1` FOREIGN KEY (`return_id`) REFERENCES `purchase_returns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_return_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `sales_details`
--
ALTER TABLE `sales_details`
  ADD CONSTRAINT `sales_details_ibfk_1` FOREIGN KEY (`sales_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sales_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sales_returns`
--
ALTER TABLE `sales_returns`
  ADD CONSTRAINT `sales_returns_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_returns_ibfk_2` FOREIGN KEY (`sales_id`) REFERENCES `sales` (`id`),
  ADD CONSTRAINT `sales_returns_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `sales_return_details`
--
ALTER TABLE `sales_return_details`
  ADD CONSTRAINT `sales_return_details_ibfk_1` FOREIGN KEY (`return_id`) REFERENCES `sales_returns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_return_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `smtp_settings`
--
ALTER TABLE `smtp_settings`
  ADD CONSTRAINT `smtp_settings_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock`
--
ALTER TABLE `stock`
  ADD CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stock_ledger`
--
ALTER TABLE `stock_ledger`
  ADD CONSTRAINT `stock_ledger_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_ledger_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_ledger_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `supplier_ledger`
--
ALTER TABLE `supplier_ledger`
  ADD CONSTRAINT `supplier_ledger_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `supplier_ledger_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `taxes`
--
ALTER TABLE `taxes`
  ADD CONSTRAINT `taxes_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `units_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
