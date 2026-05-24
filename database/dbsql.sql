-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for db_template
CREATE DATABASE IF NOT EXISTS `db_template` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `db_template`;

-- Dumping structure for table db_template.agencies
CREATE TABLE IF NOT EXISTS `agencies` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ProjectCode` varchar(25) NOT NULL,
  `AgencyId` int NOT NULL DEFAULT '0',
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `StartDate` datetime DEFAULT NULL,
  `TargetDate` datetime DEFAULT NULL,
  `RowStatus` tinyint DEFAULT (1),
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `FK_Agency` (`AgencyId`),
  CONSTRAINT `FK_Agency` FOREIGN KEY (`AgencyId`) REFERENCES `agency` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.agencies: ~1 rows (approximately)
REPLACE INTO `agencies` (`Id`, `ProjectCode`, `AgencyId`, `Name`, `Description`, `StartDate`, `TargetDate`, `RowStatus`, `Created_at`, `Updated_at`) VALUES
	(8, 'BKD2018', 1, 'Badan Keuangan Daerah 2018', 'Pengadaan pakaian seragam kantor Badan Keuangan Daerah 2018', '2018-01-01 00:00:00', '2018-04-01 19:37:07', 1, '2026-04-01 12:36:50', '2026-04-01 12:41:37');

-- Dumping structure for table db_template.agency
CREATE TABLE IF NOT EXISTS `agency` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `AgencyCode` varchar(10) NOT NULL,
  `Name` varchar(50) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `RowStatus` tinyint NOT NULL DEFAULT (1),
  `Created_at` timestamp NOT NULL DEFAULT (now()),
  `Created_by` int NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `FK_UserCreate` (`Created_by`),
  CONSTRAINT `FK_UserCreate` FOREIGN KEY (`Created_by`) REFERENCES `users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.agency: ~1 rows (approximately)
REPLACE INTO `agency` (`Id`, `AgencyCode`, `Name`, `Description`, `RowStatus`, `Created_at`, `Created_by`) VALUES
	(1, 'BKD', 'Badan Keuangan Daerah', 'Dinas BKD Provinsi', 1, '2026-04-01 12:36:18', 1);

-- Dumping structure for table db_template.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `PhoneNumber` varchar(20) DEFAULT NULL,
  `Gender` varchar(10) DEFAULT NULL,
  `AgencyId` int DEFAULT NULL,
  `RowStatus` tinyint DEFAULT '1',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `FK1toAgencyID` (`AgencyId`) USING BTREE,
  CONSTRAINT `FK1toAgencyID` FOREIGN KEY (`AgencyId`) REFERENCES `agencies` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6819 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping structure for table db_template.employee
CREATE TABLE IF NOT EXISTS `employee` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `PhoneNumber` varchar(20) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Gender` varchar(20) DEFAULT NULL,
  `JoinDate` datetime DEFAULT NULL,
  `EmployeeTypeId` int DEFAULT NULL,
  `Avatar` varchar(255) DEFAULT NULL,
  `RowStatus` bit(1) DEFAULT b'1',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `EmployeeTypeId` (`EmployeeTypeId`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`EmployeeTypeId`) REFERENCES `employeetype` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.employee: ~0 rows (approximately)

-- Dumping structure for table db_template.employeetype
CREATE TABLE IF NOT EXISTS `employeetype` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `RowStatus` bit(1) DEFAULT b'1',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.employeetype: ~0 rows (approximately)

-- Dumping structure for table db_template.headersizecustomer
CREATE TABLE IF NOT EXISTS `headersizecustomer` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CustomerId` int NOT NULL,
  `Note` text,
  `CreatedBy` int NOT NULL,
  `Rowstatus` tinyint(1) NOT NULL DEFAULT '1',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `idx_customer_id` (`CustomerId`),
  KEY `idx_created_by` (`CreatedBy`),
  CONSTRAINT `fk_hsc_customer` FOREIGN KEY (`CustomerId`) REFERENCES `customers` (`Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_hsc_user` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.headersizecustomer: ~0 rows (approximately)
REPLACE INTO `headersizecustomer` (`Id`, `CustomerId`, `Note`, `CreatedBy`, `Rowstatus`, `Created_at`, `Updated_at`) VALUES
	(50, 6818, 'Ukuran 2026', 1, 1, '2026-04-02 13:26:34', '2026-04-02 13:26:34');

-- Dumping structure for table db_template.items
CREATE TABLE IF NOT EXISTS `items` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Name` varchar(150) NOT NULL,
  `Description` text,
  `CustomerPrice` decimal(10,2) NOT NULL,
  `EmployeePrice` decimal(10,2) NOT NULL,
  `RowStatus` tinyint(1) NOT NULL DEFAULT '1',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.items: ~7 rows (approximately)
REPLACE INTO `items` (`Id`, `Code`, `Name`, `Description`, `CustomerPrice`, `EmployeePrice`, `RowStatus`, `Created_at`, `Updated_at`) VALUES
	(1, 'KLP', 'Kemeja lengan panjang', 'Kemeja lengan panjang', 175000.00, 50000.00, 1, '2026-02-17 05:01:48', '2026-04-01 11:55:44'),
	(2, 'BPLP', 'Batik puring lengan panjang', 'Batik pria dengan puring dan lengan panjang', 350000.00, 150000.00, 1, '2026-02-17 05:01:48', '2026-04-01 11:55:49'),
	(3, 'BLP', 'Batik Kemeja Lengan Panjang', 'Batik pria non puring', 200000.00, 100000.00, 1, '2026-02-17 05:01:48', '2026-04-01 11:56:04'),
	(4, 'CP', 'Celana Pria', 'Celana pria', 200000.00, 75000.00, 1, '2026-02-17 05:01:48', '2026-04-01 11:56:09'),
	(5, 'R', 'Rok', 'Rok', 150000.00, 50000.00, 1, '2026-02-17 05:01:48', '2026-04-01 11:56:12'),
	(11, 'PDH', 'Pakaian Dinas Harian (PDH)', 'Pakaian Dinas Harian (PDH)', 200000.00, 85000.00, 1, '2026-03-30 05:56:00', '2026-04-01 11:56:15'),
	(12, 'MGR', 'Data dari excel', 'Data hasil migrasi dari excel', 0.00, 0.00, 1, '2026-04-01 11:54:56', '2026-04-01 11:56:37');

-- Dumping structure for table db_template.itemsize
CREATE TABLE IF NOT EXISTS `itemsize` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ItemId` int NOT NULL,
  `Name` varchar(100) NOT NULL,
  `IsMandatory` tinyint NOT NULL DEFAULT (0),
  `RowStatus` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`Id`),
  KEY `fk_itemsize_item` (`ItemId`),
  CONSTRAINT `fk_itemsize_item` FOREIGN KEY (`ItemId`) REFERENCES `items` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.itemsize: ~18 rows (approximately)
REPLACE INTO `itemsize` (`Id`, `ItemId`, `Name`, `IsMandatory`, `RowStatus`) VALUES
	(1, 4, 'Lebar Pinggang', 0, 1),
	(2, 4, 'Lebar Panggul', 0, 1),
	(3, 4, 'Panjang Pisak', 0, 1),
	(4, 4, 'Lebar Paha', 0, 1),
	(5, 4, 'Lebar Lutut', 0, 1),
	(6, 4, 'Lebar Kaki', 0, 1),
	(7, 4, 'Panjang', 0, 1),
	(8, 5, 'Lebar Pinggang', 1, 1),
	(9, 5, 'Lebar Panggul', 1, 1),
	(10, 5, 'Panjang Rok', 1, 1),
	(11, 5, 'Lebar Bawah', 0, 1),
	(12, 11, 'Panjang Baju', 1, 1),
	(13, 11, 'Lebar Bahu', 1, 1),
	(14, 11, 'Panjang Lengan', 1, 1),
	(15, 11, 'Lebar Lengan', 1, 1),
	(16, 11, 'Lebar Dada', 1, 1),
	(17, 11, 'Lebar Pinggang', 1, 1),
	(18, 11, 'Lebar Panggul', 1, 1),
	(19, 11, 'Kerah Baju', 1, 1);

-- Dumping structure for table db_template.itemsizecustomer
CREATE TABLE IF NOT EXISTS `itemsizecustomer` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ItemSizeId` int NOT NULL,
  `HeaderSizeCustomerId` int NOT NULL,
  `Size` decimal(10,2) NOT NULL,
  `RowStatus` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`Id`),
  KEY `fk_itemsizecustomer_itemsize` (`ItemSizeId`),
  KEY `fk_itemsizecustomer_HeaderSizeCustomerId` (`HeaderSizeCustomerId`) USING BTREE,
  CONSTRAINT `FK_itemsizecustomer_headersizecustomer` FOREIGN KEY (`HeaderSizeCustomerId`) REFERENCES `headersizecustomer` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_itemsizecustomer_itemsize` FOREIGN KEY (`ItemSizeId`) REFERENCES `itemsize` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=285 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.itemsizecustomer: ~8 rows (approximately)
REPLACE INTO `itemsizecustomer` (`Id`, `ItemSizeId`, `HeaderSizeCustomerId`, `Size`, `RowStatus`) VALUES
	(277, 12, 50, 23.00, 1),
	(278, 13, 50, 23.00, 1),
	(279, 14, 50, 23.00, 1),
	(280, 15, 50, 23.00, 1),
	(281, 16, 50, 23.00, 1),
	(282, 17, 50, 23.00, 1),
	(283, 18, 50, 23.00, 1),
	(284, 19, 50, 23.00, 1);

-- Dumping structure for table db_template.menus
CREATE TABLE IF NOT EXISTS `menus` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `MenuName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `MenuUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MenuIcon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MenuSlug` varchar(100) DEFAULT NULL,
  `ParentId` int DEFAULT '0',
  `IsMenu` int DEFAULT '0',
  `OrderNo` int DEFAULT '0',
  `Rowstatus` tinyint(1) DEFAULT '1',
  `Created_at` timestamp NULL DEFAULT (now()),
  `Updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.menus: ~12 rows (approximately)
REPLACE INTO `menus` (`Id`, `MenuName`, `MenuUrl`, `MenuIcon`, `MenuSlug`, `ParentId`, `IsMenu`, `OrderNo`, `Rowstatus`, `Created_at`, `Updated_at`) VALUES
	(1, 'Dashboard', '/', 'fa-home', '', 0, 1, 1, 1, '2026-02-14 03:24:29', '2026-02-15 04:04:45'),
	(2, 'Master Data', NULL, NULL, '', 0, 0, 2, 1, '2026-02-14 03:26:26', '2026-03-30 07:47:46'),
	(3, 'User', '/users', 'fa-users', 'users', 2, 1, 1, 1, '2026-02-14 03:28:48', '2026-02-15 02:45:49'),
	(4, 'Settings', NULL, NULL, NULL, 0, 0, 4, 1, '2026-02-14 05:20:33', '2026-02-16 00:54:24'),
	(5, 'User Profile', '/user/profile', 'fa-user-cog', NULL, 4, 1, 1, 1, '2026-02-14 05:20:59', '2026-02-14 06:00:08'),
	(7, 'Pelanggan', '/customers', 'fa-users', 'customers', 2, 1, 2, 1, '2026-02-14 08:11:42', '2026-02-15 02:45:58'),
	(8, 'Pesanan Baru', '/transactions', 'fa-database', 'transactions', 11, 1, 1, 1, '2026-02-16 00:53:38', '2026-04-03 03:09:41'),
	(9, 'Instansi', '/agencies', 'fa-university', 'agencies', 2, 1, 3, 1, '2026-03-27 04:49:47', '2026-04-03 03:09:48'),
	(10, 'Data Management', '/commonfile', 'fa-database', '', 4, 1, 2, 1, '2026-03-30 07:22:46', '2026-03-30 07:47:21'),
	(11, 'Order Management', NULL, NULL, NULL, 0, 0, 3, 1, '2026-04-03 03:06:15', '2026-04-03 03:06:17'),
	(12, 'Status Pesanan', '/transactions-status', 'fa-database', '', 11, 1, 2, 1, '2026-04-03 03:08:40', '2026-04-03 07:15:31'),
	(13, 'Konfigurasi Sistem', '/config-system', 'fa-cog', NULL, 4, 1, 3, 1, '2026-04-03 03:10:24', '2026-04-03 03:11:36');

-- Dumping structure for table db_template.paymenttypes
CREATE TABLE IF NOT EXISTS `paymenttypes` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(15) NOT NULL DEFAULT '0',
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `RowStatus` bit(1) DEFAULT b'1',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.paymenttypes: ~5 rows (approximately)
REPLACE INTO `paymenttypes` (`Id`, `Code`, `Name`, `Description`, `RowStatus`, `Created_at`, `Updated_at`) VALUES
	(1, 'CASH', 'Tunai', NULL, b'1', '2026-02-16 01:40:55', '2026-04-01 12:56:00'),
	(2, 'QRIS', 'QRIS', NULL, b'1', '2026-02-16 01:41:04', '2026-04-01 12:56:03'),
	(3, 'BNI', 'Bank Transfer (BNI)', NULL, b'1', '2026-03-01 05:40:30', '2026-04-01 12:56:06'),
	(4, 'BCA', 'Bank Transfer (BCA)', NULL, b'1', '2026-03-01 05:40:46', '2026-04-01 12:56:09'),
	(5, 'NAGARI', 'Bank Transfer (Nagari)', NULL, b'1', '2026-03-01 05:40:56', '2026-04-01 12:56:16');

-- Dumping structure for table db_template.rolemapping
CREATE TABLE IF NOT EXISTS `rolemapping` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rolesId` int NOT NULL,
  `menusId` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rolemapping_roles` (`rolesId`),
  KEY `fk_rolemapping_menus` (`menusId`),
  CONSTRAINT `fk_rolemapping_menus` FOREIGN KEY (`menusId`) REFERENCES `menus` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rolemapping_roles` FOREIGN KEY (`rolesId`) REFERENCES `roles` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.rolemapping: ~16 rows (approximately)
REPLACE INTO `rolemapping` (`id`, `rolesId`, `menusId`, `created_at`) VALUES
	(1, 1, 1, '2026-02-14 03:29:37'),
	(2, 1, 2, '2026-02-14 03:29:47'),
	(3, 1, 3, '2026-02-14 03:29:56'),
	(4, 1, 4, '2026-02-14 05:21:32'),
	(5, 1, 5, '2026-02-14 05:21:36'),
	(6, 1, 7, '2026-02-14 08:13:26'),
	(7, 2, 1, '2026-02-15 03:44:53'),
	(8, 2, 4, '2026-02-15 03:45:13'),
	(9, 2, 5, '2026-02-15 03:45:21'),
	(10, 1, 8, '2026-02-16 01:00:12'),
	(11, 1, 9, '2026-03-27 04:52:13'),
	(12, 2, 9, '2026-03-27 04:52:21'),
	(13, 1, 10, '2026-03-30 07:23:56'),
	(14, 1, 11, '2026-04-03 03:12:13'),
	(15, 1, 12, '2026-04-03 03:12:30'),
	(16, 1, 13, '2026-04-03 03:12:39');

-- Dumping structure for table db_template.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(100) NOT NULL,
  `Rowstatus` tinyint(1) DEFAULT '1',
  `Created_at` timestamp NULL DEFAULT (now()),
  `Updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.roles: ~0 rows (approximately)
REPLACE INTO `roles` (`Id`, `RoleName`, `Rowstatus`, `Created_at`, `Updated_at`) VALUES
	(1, 'Super Admin', 1, '2026-02-14 03:22:52', '2026-02-14 03:22:52'),
	(2, 'Administrator', 1, '2026-02-15 03:44:38', '2026-02-15 03:44:38');

-- Dumping structure for table db_template.statusitem
CREATE TABLE IF NOT EXISTS `statusitem` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(10) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `ColorSlug` varchar(255) DEFAULT NULL,
  `IconSlug` varchar(255) DEFAULT NULL,
  `Sequence` int DEFAULT (0),
  `RowStatus` bit(1) DEFAULT b'1',
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.statusitem: ~11 rows (approximately)
REPLACE INTO `statusitem` (`Id`, `Code`, `Name`, `Description`, `ColorSlug`, `IconSlug`, `Sequence`, `RowStatus`, `Created_at`, `Updated_at`) VALUES
	(1, 'BARU', 'Diterima', 'Pesanan baru masuk dan telah dikonfirmasi', 'bg-light text-dark', 'bi-envelope-open', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:06:34'),
	(2, 'POTONG', 'Pola & Potong', 'Kain sedang diproses oleh tukang potong untuk pembuatan pola', 'bg-warning text-dark', 'bi-scissors', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:06:31'),
	(3, 'JAHIT', 'Proses Jahit', 'Pakaian sedang dijahit oleh tukang jahit', 'bg-warning text-dark', 'bi-cpu', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:06:27'),
	(4, 'PSKC', 'Pasang Kancing', 'Proses pemasangan kancing, obras, dan detail lainnya', 'bg-info', 'bi-stars', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:06:24'),
	(5, 'GOSOK', 'Setrika', 'Pakaian sedang disetrika atau di-uap untuk kerapihan', 'bg-info', 'bi-cloud-haze2', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:06:17'),
	(6, 'OK', 'Siap Diambil', 'Pakaian sudah selesai produksi dan menunggu pelanggan', 'bg-success', 'bi-bag-check', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:06:05'),
	(7, 'DIAMBIL', 'Sudah Diambil', 'Pakaian telah diserahkan kepada pelanggan', 'bg-primary', 'bi-check2-all', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:06:13'),
	(8, 'PERMAK', 'Perbaikan (Permak)', 'Pakaian sedang diperbaiki kembali sesuai permintaan', 'bg-danger', 'bi-tools', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:05:31'),
	(9, 'PENDING', 'Pending', 'Pesanan ditangguhkan karena alasan tertentu', 'bg-danger', 'bi-hourglass', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:05:36'),
	(10, 'BORDIR', 'Bordir', 'Pesanan sedang di bordir', 'bg-waring text-dark', 'bi-pause-circle', NULL, b'1', '2026-03-31 08:28:06', '2026-04-01 14:05:21'),
	(11, 'BU', 'Belum Ukur', 'Pesanan belum diukur', 'bg-danger', 'bi-hourglass', 0, b'1', '2026-04-01 13:37:17', '2026-04-01 14:13:11');

-- Dumping structure for table db_template.statustransaction
CREATE TABLE IF NOT EXISTS `statustransaction` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(10) NOT NULL,
  `Name` varchar(50) NOT NULL,
  `Description` varchar(255) NOT NULL,
  `ColorSlug` varchar(25) NOT NULL,
  `IconSlug` varchar(25) NOT NULL,
  `Sequence` int NOT NULL DEFAULT (0),
  `RowStatus` tinyint DEFAULT (1),
  `Created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.statustransaction: ~7 rows (approximately)
REPLACE INTO `statustransaction` (`Id`, `Code`, `Name`, `Description`, `ColorSlug`, `IconSlug`, `Sequence`, `RowStatus`, `Created_at`) VALUES
	(1, 'NEW', 'Diterima', 'Pesanan diterima', '', 'bi-stars', 0, 1, '2026-04-01 13:41:05'),
	(2, 'PROSES', 'Proses Pengerjaan', 'Pesanan sedang dalam pengerjaan', '', 'bi-hourglass-split', 0, 1, '2026-04-01 13:41:51'),
	(3, 'OK', 'Pesanan Complete', 'Pesanan sudah selesai', '', 'bi-check-circle', 0, 1, '2026-04-01 13:43:34'),
	(4, 'SELESAI', 'Sudah diambil - Lunas', 'Pesanan sudah diambil', '', 'bi-check-circle', 0, 1, '2026-04-01 13:43:47'),
	(5, 'BB', 'Sudah diambil - Belum Bayar', 'Pesanan sudah diambil namun belum bayar', '', 'bi-exclamation-triangle', 0, 1, '2026-04-01 13:46:14'),
	(6, 'BTL', 'Dibatalkan', 'Pesanan dibatalkan', '', 'bi-x-circle', 0, 1, '2026-04-01 13:47:42'),
	(8, 'PENDING', 'Pending', 'Pesanan Pending', '', 'bi-clock', 0, 1, '2026-04-01 14:09:19');

-- Dumping structure for table db_template.transactiondetails
CREATE TABLE IF NOT EXISTS `transactiondetails` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TransactionId` int NOT NULL,
  `ItemId` int NOT NULL,
  `HeaderSizeCustomerId` int DEFAULT NULL,
  `CustomerPrice` decimal(18,2) DEFAULT '0.00',
  `EmployeePrice` decimal(18,2) DEFAULT '0.00',
  `Additional` tinyint(1) DEFAULT '0',
  `DescriptionAdditional` varchar(255) DEFAULT '-',
  `PriceAdditional` decimal(18,2) DEFAULT '0.00',
  `StatusItemId` int NOT NULL,
  `Note` text,
  `RowStatus` tinyint(1) NOT NULL DEFAULT (1),
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `idx_transaction` (`TransactionId`),
  KEY `idx_item` (`ItemId`),
  KEY `idx_status` (`StatusItemId`),
  KEY `idx_header_size` (`HeaderSizeCustomerId`),
  CONSTRAINT `fk_header_size_detail` FOREIGN KEY (`HeaderSizeCustomerId`) REFERENCES `headersizecustomer` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_item_detail` FOREIGN KEY (`ItemId`) REFERENCES `items` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_status_item_detail` FOREIGN KEY (`StatusItemId`) REFERENCES `statusitem` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transaction_detail` FOREIGN KEY (`TransactionId`) REFERENCES `transactions` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2635 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Dumping structure for table db_template.transactions
CREATE TABLE IF NOT EXISTS `transactions` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TransactionCode` varchar(50) NOT NULL DEFAULT '0',
  `CustomerId` int NOT NULL,
  `AgencyId` int DEFAULT NULL,
  `TransactionDate` datetime NOT NULL,
  `CompletionDate` datetime DEFAULT NULL,
  `Amount` decimal(18,2) NOT NULL,
  `PaidAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `BalanceDue` decimal(18,2) GENERATED ALWAYS AS ((`Amount` - `PaidAmount`)) STORED,
  `Note` varchar(500) DEFAULT NULL,
  `PaymentTypeId` int NOT NULL,
  `StatusTransactionId` int NOT NULL,
  `RowStatus` tinyint NOT NULL,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_by` int NOT NULL,
  `Updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `FK_Transaction_Customer` (`CustomerId`),
  KEY `FK_Transaction_Agency` (`AgencyId`),
  KEY `FK_Transaction_PaymentType` (`PaymentTypeId`),
  KEY `FK_Transaction_User` (`Created_by`) USING BTREE,
  KEY `FK_Transaction_status` (`StatusTransactionId`),
  CONSTRAINT `FK_Transaction_Agency` FOREIGN KEY (`AgencyId`) REFERENCES `agencies` (`Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_Transaction_Creator` FOREIGN KEY (`Created_by`) REFERENCES `users` (`Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_Transaction_Customer` FOREIGN KEY (`CustomerId`) REFERENCES `customers` (`Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_Transaction_PaymentType` FOREIGN KEY (`PaymentTypeId`) REFERENCES `paymenttypes` (`Id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_Transaction_status` FOREIGN KEY (`StatusTransactionId`) REFERENCES `statustransaction` (`Id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2632 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping structure for table db_template.users
CREATE TABLE IF NOT EXISTS `users` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Nama_pengguna` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RolesId` int NOT NULL,
  `Rowstatus` tinyint(1) DEFAULT '1',
  `Created_at` timestamp NULL DEFAULT (now()),
  `Updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE KEY `username` (`Username`) USING BTREE,
  KEY `fk_users_roles` (`RolesId`) USING BTREE,
  CONSTRAINT `fk_users_roles` FOREIGN KEY (`RolesId`) REFERENCES `roles` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_template.users: ~4 rows (approximately)
REPLACE INTO `users` (`Id`, `Nama_pengguna`, `Username`, `Password`, `RolesId`, `Rowstatus`, `Created_at`, `Updated_at`) VALUES
	(1, 'Rifaldi Adrian', 'rfldadrn', '$2y$10$mPSYScVMgdh3VHpL7FKwZujFQUCZLyNaozXQACkNbgeIVmsZfJ18e', 1, 1, '2026-02-14 03:30:37', '2026-02-22 04:32:49'),
	(2, 'Khairur Rozis', 'krozi', '$2y$10$NSXmuL27DyyS6a3MUcs6HeBL1jY1ycQbzwU1T4Xzlacc/042Op9fe', 2, 1, '2026-02-14 03:41:30', '2026-02-15 04:10:53'),
	(8, 'Muhammad Haikal Zahirsa', 'kalls', '$2y$10$hbtklL5yIKanZ054e0lnA.GaSKLWfOvVtt6I7qxaXki3up7HZORYa', 2, 1, '2026-02-15 04:14:41', '2026-02-15 04:14:45'),
	(9, 'Syaharani Ara', 'ara', '$2y$10$vNO.V1EoLMTIr87uN8mFhOKLG2A6GGP3WsX8dLlzdyrYF1ppp20c6', 2, 1, '2026-02-21 17:51:28', '2026-02-21 17:51:49'),
	(10, 'Danish Athallah Ardana', 'danish', '$2y$10$ng1DZGwtDsHIgFh4UxOO7.u09kaCD0Wq/V3ed4cqgGMjOveaI0wcm', 2, 1, '2026-03-25 10:54:06', '2026-03-25 10:54:06');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
