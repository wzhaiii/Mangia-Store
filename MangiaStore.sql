/* =====================================================
   MANGIA STORE - Script tạo cơ sở dữ liệu (SQL Server)
   Cách dùng: chạy cả file này trong SSMS (Ctrl+A rồi F5).
   - Tự tạo database MangiaStore nếu chưa có.
   - Chạy trên database TRỐNG (chạy lần hai sẽ báo bảng đã tồn tại).
   - Có sẵn: 10 bộ truyện, 100 tập, 5 thể loại, 2 mã giảm giá,
     và 1 tài khoản admin mẫu (xem cuối file).
   ===================================================== */
USE [master]
GO
IF DB_ID(N'MangiaStore') IS NULL CREATE DATABASE [MangiaStore]
GO
USE [MangiaStore]
GO
/****** Object:  Table [dbo].[Books]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Books](
	[BookId] [int] IDENTITY(1,1) NOT NULL,
	[Title] [nvarchar](255) NOT NULL,
	[Author] [nvarchar](255) NOT NULL,
	[CategoryId] [int] NOT NULL,
	[Price] [decimal](12, 0) NOT NULL,
	[Descrip] [nvarchar](max) NULL,
	[ImageUrl] [varchar](500) NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[BookId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BookVolumes]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BookVolumes](
	[VolumeId] [int] IDENTITY(1,1) NOT NULL,
	[BookId] [int] NOT NULL,
	[VolumeNo] [int] NOT NULL,
	[Stock] [int] NOT NULL,
	[ImageUrl] [nvarchar](255) NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VolumeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CartItems]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CartItems](
	[CartItemId] [int] IDENTITY(1,1) NOT NULL,
	[CartId] [int] NOT NULL,
	[VolumeId] [int] NOT NULL,
	[Quantity] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[CartItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Carts]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Carts](
	[CartId] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[CreatedAt] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[CartId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Categories]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Categories](
	[CategoryId] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[CategoryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OrderDetails]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OrderDetails](
	[OrderDetailId] [int] IDENTITY(1,1) NOT NULL,
	[OrderId] [int] NOT NULL,
	[VolumeId] [int] NOT NULL,
	[Quantity] [int] NOT NULL,
	[UnitPrice] [decimal](18, 0) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[OrderDetailId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Orders]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Orders](
	[OrderId] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[ReceiverName] [nvarchar](100) NOT NULL,
	[Phone] [varchar](15) NOT NULL,
	[Address] [nvarchar](255) NOT NULL,
	[Ward] [nvarchar](100) NULL,
	[Province] [nvarchar](100) NOT NULL,
	[Note] [nvarchar](500) NULL,
	[Subtotal] [decimal](18, 0) NOT NULL,
	[ShippingFee] [decimal](18, 0) NOT NULL,
	[TotalAmount] [decimal](18, 0) NOT NULL,
	[ShippingCarrier] [varchar](20) NOT NULL,
	[TrackingCode] [varchar](50) NULL,
	[Status] [varchar](20) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[VoucherId] [int] NULL,
	[DiscountAmount] [decimal](18, 0) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[OrderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OrderStatusHistory]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OrderStatusHistory](
	[HistoryId] [int] IDENTITY(1,1) NOT NULL,
	[OrderId] [int] NOT NULL,
	[FromStatus] [varchar](20) NULL,
	[ToStatus] [varchar](20) NOT NULL,
	[ChangedBy] [int] NULL,
	[Note] [nvarchar](255) NULL,
	[ChangedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[HistoryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PasswordResets]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PasswordResets](
	[Email] [nvarchar](255) NOT NULL,
	[OtpHash] [nvarchar](255) NOT NULL,
	[ExpiresAt] [datetime2](7) NOT NULL,
	[Attempts] [int] NOT NULL,
	[LastSentAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Payments]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Payments](
	[PaymentId] [int] IDENTITY(1,1) NOT NULL,
	[OrderId] [int] NOT NULL,
	[Method] [varchar](10) NOT NULL,
	[Amount] [decimal](18, 0) NOT NULL,
	[Status] [varchar](10) NOT NULL,
	[PaidAt] [datetime2](7) NULL,
	[TransactionRef] [varchar](100) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[PaymentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PendingRegistrations]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PendingRegistrations](
	[Email] [nvarchar](255) NOT NULL,
	[FullName] [nvarchar](100) NOT NULL,
	[PasswordHash] [nvarchar](255) NOT NULL,
	[OtpHash] [nvarchar](255) NOT NULL,
	[ExpiresAt] [datetime2](7) NOT NULL,
	[Attempts] [int] NOT NULL,
	[LastSentAt] [datetime2](7) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Refunds]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Refunds](
	[RefundId] [int] IDENTITY(1,1) NOT NULL,
	[OrderId] [int] NOT NULL,
	[ReturnId] [int] NULL,
	[Amount] [decimal](18, 0) NOT NULL,
	[Reason] [varchar](20) NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[Note] [nvarchar](255) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[CompletedAt] [datetime2](7) NULL,
	[CompletedBy] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[RefundId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ReturnItems]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ReturnItems](
	[ReturnItemId] [int] IDENTITY(1,1) NOT NULL,
	[ReturnId] [int] NOT NULL,
	[VolumeId] [int] NOT NULL,
	[Quantity] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ReturnItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ReturnRequests]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ReturnRequests](
	[ReturnId] [int] IDENTITY(1,1) NOT NULL,
	[OrderId] [int] NOT NULL,
	[UserId] [int] NOT NULL,
	[Type] [varchar](10) NOT NULL,
	[Reason] [nvarchar](500) NOT NULL,
	[RefundInfo] [nvarchar](255) NULL,
	[Status] [varchar](20) NOT NULL,
	[AdminNote] [nvarchar](500) NULL,
	[Restocked] [bit] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[ReturnId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Reviews]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Reviews](
	[ReviewId] [int] IDENTITY(1,1) NOT NULL,
	[BookId] [int] NOT NULL,
	[UserId] [int] NOT NULL,
	[Rating] [tinyint] NOT NULL,
	[Comment] [nvarchar](1000) NULL,
	[IsVisible] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[ReviewId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StockMovements]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StockMovements](
	[MovementId] [int] IDENTITY(1,1) NOT NULL,
	[VolumeId] [int] NOT NULL,
	[QuantityChange] [int] NOT NULL,
	[StockAfter] [int] NOT NULL,
	[Reason] [varchar](20) NOT NULL,
	[OrderId] [int] NULL,
	[Note] [nvarchar](255) NULL,
	[CreatedBy] [int] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[MovementId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[fullName] [nvarchar](100) NOT NULL,
	[email] [nvarchar](150) NOT NULL,
	[password] [nvarchar](255) NULL,
	[createdate] [datetime] NULL,
	[googleId] [nvarchar](500) NULL,
	[provider] [nvarchar](20) NOT NULL,
	[Role] [varchar](10) NOT NULL,
	[IsLocked] [bit] NOT NULL,
	[Phone] [varchar](15) NULL,
	[Address] [nvarchar](255) NULL,
	[Ward] [nvarchar](100) NULL,
	[Province] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vouchers]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vouchers](
	[VoucherId] [int] IDENTITY(1,1) NOT NULL,
	[Code] [varchar](30) NOT NULL,
	[DiscountType] [varchar](10) NOT NULL,
	[DiscountValue] [decimal](18, 0) NOT NULL,
	[MaxDiscount] [decimal](18, 0) NULL,
	[MinOrder] [decimal](18, 0) NOT NULL,
	[UsageLimit] [int] NULL,
	[UsedCount] [int] NOT NULL,
	[PerUserLimit] [int] NOT NULL,
	[StartsAt] [datetime2](7) NULL,
	[ExpiresAt] [datetime2](7) NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VoucherId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VoucherUsages]    Script Date: 16/11/2026 10:30:04 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VoucherUsages](
	[UsageId] [int] IDENTITY(1,1) NOT NULL,
	[VoucherId] [int] NOT NULL,
	[UserId] [int] NOT NULL,
	[OrderId] [int] NOT NULL,
	[DiscountAmount] [decimal](18, 0) NOT NULL,
	[UsedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UsageId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Books] ON 

INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (1, N'One Piece', N'Eiichiro Oda', 1, CAST(36000 AS Decimal(12, 0)), N'Cuộc phiêu lưu của băng hải tặc Mũ Rơm tiếp tục...', N'/uploads/books/OnePiece.jpg', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (2, N'Attack On Titan', N'Hajime Isayama', 2, CAST(40000 AS Decimal(12, 0)), N'Cuộc chiến giữa con người và những sinh vật khổng lồ...', N'/uploads/books/AttackOnTitan.jpg', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (3, N'Death Note', N'Tsugumi Ohba', 3, CAST(36000 AS Decimal(12, 0)), N'Một cuốn sổ thần kỳ có thể giết người khi viết tên họ vào đó...', N'/uploads/books/DeathNote.jpg', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (4, N'Thám tử lừng danh Conan', N'Gosho Aoyama', 5, CAST(36000 AS Decimal(12, 0)), N'Thám tử trung học Kudo Shinichi dưới hình dạng bị teo nhỏ...', N'/uploads/books/Conan.jpg', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (5, N'Chú mèo máy đến từ tương lai Doraemon', N'Fujiko F Fujio', 4, CAST(25000 AS Decimal(12, 0)), N'Một chú mèo máy đến từ thế kỷ 22...', N'/uploads/books/Doraemon.png', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (6, N'Thanh gươm diệt quỷ', N'Gotouge Koyoharu', 2, CAST(36000 AS Decimal(12, 0)), N'Cuộc chiến chống lại lũ quỷ của Tanjiro...', N'/uploads/books/DemonSlayer.jpg', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (7, N'Bảy viên ngọc rồng Dragon Ball', N'Akira Toriyama', 1, CAST(36000 AS Decimal(12, 0)), N'Hành trình đi tìm những viên ngọc rồng...', N'/uploads/books/DragonBall.webp', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (8, N'Naruto', N'Masashi Kishimoto', 2, CAST(60000 AS Decimal(12, 0)), N'Quá khứ bất hạnh và sự trưởng thành mạnh mẽ của Naruto...', N'/uploads/books/Naruto.webp', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (9, N'Pokemon', N'Hidenori Kusaka', 4, CAST(36000 AS Decimal(12, 0)), N'Khám phá và thu phục những quái vật Pokemon mới...', N'/uploads/books/Pokemon.jpg', 1)
INSERT [dbo].[Books] ([BookId], [Title], [Author], [CategoryId], [Price], [Descrip], [ImageUrl], [IsActive]) VALUES (10, N'Shin-Cậu bé bút chì', N'Yoshito Usui', 4, CAST(30000 AS Decimal(12, 0)), N'Cuộc sống hằng ngày xoay quanh cậu nhóc nghịch ngợm Shinosuke...', N'/uploads/books/Shin.webp', 1)
SET IDENTITY_INSERT [dbo].[Books] OFF
GO
SET IDENTITY_INSERT [dbo].[BookVolumes] ON 

INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (1, 1, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (2, 1, 2, 36, N'/uploads/books/OnePiece2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (3, 1, 3, 36, N'/uploads/books/OnePiece3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (4, 1, 4, 36, N'/uploads/books/OnePiece4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (5, 1, 5, 36, N'/uploads/books/OnePiece5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (6, 1, 6, 36, N'/uploads/books/OnePiece6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (7, 1, 7, 35, N'/uploads/books/OnePiece7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (8, 1, 8, 36, N'/uploads/books/OnePiece8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (9, 1, 9, 36, N'/uploads/books/OnePiece9.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (10, 1, 10, 36, N'/uploads/books/OnePiece10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (11, 2, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (12, 2, 2, 36, N'/uploads/books/AttackOnTitan2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (13, 2, 3, 36, N'/uploads/books/AttackOnTitan3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (14, 2, 4, 36, N'/uploads/books/AttackOnTitan4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (15, 2, 5, 36, N'/uploads/books/AttackOnTitan5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (16, 2, 6, 36, N'/uploads/books/AttackOnTitan6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (17, 2, 7, 36, N'/uploads/books/AttackOnTitan7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (18, 2, 8, 36, N'/uploads/books/AttackOnTitan8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (19, 2, 9, 36, N'/uploads/books/AttackOnTitan9.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (20, 2, 10, 36, N'/uploads/books/AttackOnTitan10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (21, 3, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (22, 3, 2, 36, N'/uploads/books/DeathNote2.webp', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (23, 3, 3, 36, N'/uploads/books/DeathNote3.webp', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (24, 3, 4, 36, N'/uploads/books/DeathNote4.webp', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (25, 3, 5, 36, N'/uploads/books/DeathNote5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (26, 3, 6, 36, N'/uploads/books/DeathNote6.webp', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (27, 3, 7, 36, N'/uploads/books/DeathNote7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (28, 3, 8, 35, N'/uploads/books/DeathNote8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (29, 3, 9, 36, N'/uploads/books/DeathNote9.webp', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (30, 3, 10, 36, N'/uploads/books/DeathNote10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (31, 4, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (32, 4, 2, 36, N'/uploads/volumes/Conan2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (33, 4, 3, 36, N'/uploads/volumes/Conan3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (34, 4, 4, 36, N'/uploads/volumes/Conan4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (35, 4, 5, 36, N'/uploads/volumes/Conan5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (36, 4, 6, 36, N'/uploads/volumes/Conan6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (37, 4, 7, 36, N'/uploads/volumes/Conan7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (38, 4, 8, 36, N'/uploads/volumes/Conan8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (39, 4, 9, 36, N'/uploads/volumes/Conan9.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (40, 4, 10, 36, N'/uploads/volumes/Conan10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (41, 5, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (42, 5, 2, 36, N'/uploads/volumes/Doraemon2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (43, 5, 3, 36, N'/uploads/volumes/Doraemon3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (44, 5, 4, 36, N'/uploads/volumes/Doraemon4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (45, 5, 5, 36, N'/uploads/volumes/Doraemon5.webp', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (46, 5, 6, 36, N'/uploads/volumes/Doraemon6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (47, 5, 7, 36, N'/uploads/volumes/Doraemon7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (48, 5, 8, 36, N'/uploads/volumes/Doraemon8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (49, 5, 9, 36, N'/uploads/volumes/Doraemon9.webp', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (50, 5, 10, 36, N'/uploads/volumes/Doraemon10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (51, 6, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (52, 6, 2, 36, N'/uploads/volumes/DemonSlayer2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (53, 6, 3, 36, N'/uploads/volumes/DemonSlayer3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (54, 6, 4, 36, N'/uploads/volumes/DemonSlayer4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (55, 6, 5, 36, N'/uploads/volumes/DemonSlayer5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (56, 6, 6, 36, N'/uploads/volumes/DemonSlayer6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (57, 6, 7, 36, N'/uploads/volumes/DemonSlayer7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (58, 6, 8, 36, N'/uploads/volumes/DemonSlayer8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (59, 6, 9, 36, N'/uploads/volumes/DemonSlayer9.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (60, 6, 10, 36, N'/uploads/volumes/DemonSlayer10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (61, 7, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (62, 7, 2, 36, N'/uploads/volumes/DragonBall2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (63, 7, 3, 36, N'/uploads/volumes/DragonBall3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (64, 7, 4, 36, N'/uploads/volumes/DragonBall4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (65, 7, 5, 36, N'/uploads/volumes/DragonBall5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (66, 7, 6, 36, N'/uploads/volumes/DragonBall6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (67, 7, 7, 36, N'/uploads/volumes/DragonBall7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (68, 7, 8, 36, N'/uploads/volumes/DragonBall8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (69, 7, 9, 36, N'/uploads/volumes/DragonBall9.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (70, 7, 10, 36, N'/uploads/volumes/DragonBall10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (71, 8, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (72, 8, 2, 36, N'/uploads/volumes/Naruto2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (73, 8, 3, 36, N'/uploads/volumes/Naruto3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (74, 8, 4, 36, N'/uploads/volumes/Naruto4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (75, 8, 5, 36, N'/uploads/volumes/Naruto5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (76, 8, 6, 36, N'/uploads/volumes/Naruto6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (77, 8, 7, 36, N'/uploads/volumes/Naruto7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (78, 8, 8, 36, N'/uploads/volumes/Naruto8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (79, 8, 9, 36, N'/uploads/volumes/Naruto9.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (80, 8, 10, 36, N'/uploads/volumes/Naruto10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (81, 9, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (82, 9, 2, 36, N'/uploads/volumes/Pokemon2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (83, 9, 3, 36, N'/uploads/volumes/Pokemon3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (84, 9, 4, 36, N'/uploads/volumes/Pokemon4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (85, 9, 5, 36, N'/uploads/volumes/Pokemon5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (86, 9, 6, 36, N'/uploads/volumes/Pokemon6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (87, 9, 7, 36, N'/uploads/volumes/Pokemon7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (88, 9, 8, 36, N'/uploads/volumes/Pokemon8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (89, 9, 9, 36, N'/uploads/volumes/Pokemon9.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (90, 9, 10, 36, N'/uploads/volumes/Pokemon10.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (91, 10, 1, 36, NULL, 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (92, 10, 2, 36, N'/uploads/volumes/Shin2.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (93, 10, 3, 36, N'/uploads/volumes/Shin3.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (94, 10, 4, 36, N'/uploads/volumes/Shin4.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (95, 10, 5, 36, N'/uploads/volumes/Shin5.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (96, 10, 6, 36, N'/uploads/volumes/Shin6.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (97, 10, 7, 36, N'/uploads/volumes/Shin7.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (98, 10, 8, 36, N'/uploads/volumes/Shin8.jpg', 1)
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (99, 10, 9, 36, N'/uploads/volumes/Shin9.jpg', 1)
GO
INSERT [dbo].[BookVolumes] ([VolumeId], [BookId], [VolumeNo], [Stock], [ImageUrl], [IsActive]) VALUES (100, 10, 10, 36, N'/uploads/volumes/Shin10.jpg', 1)
SET IDENTITY_INSERT [dbo].[BookVolumes] OFF
GO

GO
SET IDENTITY_INSERT [dbo].[Categories] ON 

INSERT [dbo].[Categories] ([CategoryId], [Name], [IsActive]) VALUES (1, N'Phiêu lưu', 1)
INSERT [dbo].[Categories] ([CategoryId], [Name], [IsActive]) VALUES (2, N'Hành động', 1)
INSERT [dbo].[Categories] ([CategoryId], [Name], [IsActive]) VALUES (3, N'Tâm Lý', 1)
INSERT [dbo].[Categories] ([CategoryId], [Name], [IsActive]) VALUES (4, N'Thiếu nhi', 1)
INSERT [dbo].[Categories] ([CategoryId], [Name], [IsActive]) VALUES (5, N'Trinh thám', 1)
SET IDENTITY_INSERT [dbo].[Categories] OFF
GO

GO

GO

GO

GO

GO

GO

GO

GO
SET IDENTITY_INSERT [dbo].[StockMovements] ON 

INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (1, 1, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (2, 2, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (3, 3, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (4, 4, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (5, 5, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (6, 6, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (7, 7, 35, 35, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (8, 8, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (9, 9, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (10, 10, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (11, 11, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (12, 12, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (13, 13, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (14, 14, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (15, 15, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (16, 16, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (17, 17, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (18, 18, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (19, 19, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (20, 20, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (21, 21, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (22, 22, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (23, 23, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (24, 24, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (25, 25, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (26, 26, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (27, 27, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (28, 28, 35, 35, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (29, 29, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (30, 30, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (31, 31, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (32, 32, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (33, 33, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (34, 34, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (35, 35, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (36, 36, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (37, 37, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (38, 38, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (39, 39, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (40, 40, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (41, 41, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (42, 42, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (43, 43, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (44, 44, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (45, 45, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (46, 46, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (47, 47, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (48, 48, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (49, 49, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (50, 50, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (51, 51, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (52, 52, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (53, 53, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (54, 54, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (55, 55, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (56, 56, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (57, 57, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (58, 58, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (59, 59, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (60, 60, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (61, 61, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (62, 62, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (63, 63, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (64, 64, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (65, 65, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (66, 66, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (67, 67, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (68, 68, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (69, 69, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (70, 70, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (71, 71, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (72, 72, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (73, 73, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (74, 74, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (75, 75, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (76, 76, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (77, 77, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (78, 78, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (79, 79, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (80, 80, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (81, 81, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (82, 82, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (83, 83, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (84, 84, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (85, 85, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (86, 86, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (87, 87, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (88, 88, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (89, 89, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (90, 90, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (91, 91, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (92, 92, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (93, 93, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (94, 94, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (95, 95, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (96, 96, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (97, 97, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (98, 98, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (99, 99, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
GO
INSERT [dbo].[StockMovements] ([MovementId], [VolumeId], [QuantityChange], [StockAfter], [Reason], [OrderId], [Note], [CreatedBy], [CreatedAt]) VALUES (100, 100, 36, 36, N'initial', NULL, N'Tồn kho ban đầu (lúc bắt đầu ghi lịch sử)', NULL, CAST(N'2026-10-27T14:32:18.9981765' AS DateTime2))
SET IDENTITY_INSERT [dbo].[StockMovements] OFF
GO

GO
SET IDENTITY_INSERT [dbo].[Vouchers] ON 

INSERT [dbo].[Vouchers] ([VoucherId], [Code], [DiscountType], [DiscountValue], [MaxDiscount], [MinOrder], [UsageLimit], [UsedCount], [PerUserLimit], [StartsAt], [ExpiresAt], [IsActive], [CreatedAt]) VALUES (1, N'GIAM10', N'percent', CAST(10 AS Decimal(18, 0)), CAST(30000 AS Decimal(18, 0)), CAST(100000 AS Decimal(18, 0)), 100, 0, 1, NULL, NULL, 1, CAST(N'2026-11-08T21:47:02.1045573' AS DateTime2))
INSERT [dbo].[Vouchers] ([VoucherId], [Code], [DiscountType], [DiscountValue], [MaxDiscount], [MinOrder], [UsageLimit], [UsedCount], [PerUserLimit], [StartsAt], [ExpiresAt], [IsActive], [CreatedAt]) VALUES (2, N'GIAM20K', N'fixed', CAST(20000 AS Decimal(18, 0)), NULL, CAST(150000 AS Decimal(18, 0)), NULL, 0, 1, NULL, NULL, 1, CAST(N'2026-11-08T21:47:02.1045573' AS DateTime2))
SET IDENTITY_INSERT [dbo].[Vouchers] OFF
GO
/****** Object:  Index [IX_Books_CategoryId]    Script Date: 16/11/2026 10:30:04 SA ******/
CREATE NONCLUSTERED INDEX [IX_Books_CategoryId] ON [dbo].[Books]
(
	[CategoryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Books_Title]    Script Date: 16/11/2026 10:30:04 SA ******/
CREATE NONCLUSTERED INDEX [IX_Books_Title] ON [dbo].[Books]
(
	[Title] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_BookVolumes_Book_VolumeNo]    Script Date: 16/11/2026 10:30:04 SA ******/
ALTER TABLE [dbo].[BookVolumes] ADD  CONSTRAINT [UQ_BookVolumes_Book_VolumeNo] UNIQUE NONCLUSTERED 
(
	[BookId] ASC,
	[VolumeNo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_CartItems_Cart_Volume]    Script Date: 16/11/2026 10:30:04 SA ******/
ALTER TABLE [dbo].[CartItems] ADD  CONSTRAINT [UQ_CartItems_Cart_Volume] UNIQUE NONCLUSTERED 
(
	[CartId] ASC,
	[VolumeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__Carts__1788CC4D69B0C6D7]    Script Date: 16/11/2026 10:30:04 SA ******/
ALTER TABLE [dbo].[Carts] ADD UNIQUE NONCLUSTERED 
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Categori__737584F6D2DD9B71]    Script Date: 16/11/2026 10:30:04 SA ******/
ALTER TABLE [dbo].[Categories] ADD UNIQUE NONCLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_OrderStatusHistory_Order]    Script Date: 16/11/2026 10:30:04 SA ******/
CREATE NONCLUSTERED INDEX [IX_OrderStatusHistory_Order] ON [dbo].[OrderStatusHistory]
(
	[OrderId] ASC,
	[HistoryId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_ReturnItems]    Script Date: 16/11/2026 10:30:04 SA ******/
ALTER TABLE [dbo].[ReturnItems] ADD  CONSTRAINT [UQ_ReturnItems] UNIQUE NONCLUSTERED 
(
	[ReturnId] ASC,
	[VolumeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_Reviews_Book_User]    Script Date: 16/11/2026 10:30:04 SA ******/
ALTER TABLE [dbo].[Reviews] ADD  CONSTRAINT [UQ_Reviews_Book_User] UNIQUE NONCLUSTERED 
(
	[BookId] ASC,
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Reviews_BookId]    Script Date: 16/11/2026 10:30:04 SA ******/
CREATE NONCLUSTERED INDEX [IX_Reviews_BookId] ON [dbo].[Reviews]
(
	[BookId] ASC,
	[IsVisible] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_StockMovements_Volume]    Script Date: 16/11/2026 10:30:04 SA ******/
CREATE NONCLUSTERED INDEX [IX_StockMovements_Volume] ON [dbo].[StockMovements]
(
	[VolumeId] ASC,
	[MovementId] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Users__AB6E616495DFB7CB]    Script Date: 16/11/2026 10:30:04 SA ******/
ALTER TABLE [dbo].[Users] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Vouchers__A25C5AA7A0757FF1]    Script Date: 16/11/2026 10:30:04 SA ******/
ALTER TABLE [dbo].[Vouchers] ADD UNIQUE NONCLUSTERED 
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Books] ADD  CONSTRAINT [DF_Books_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[BookVolumes] ADD  DEFAULT ((0)) FOR [Stock]
GO
ALTER TABLE [dbo].[BookVolumes] ADD  CONSTRAINT [DF_BookVolumes_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Carts] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Categories] ADD  CONSTRAINT [DF_Categories_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT ((0)) FOR [ShippingFee]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT ('pending') FOR [Status]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Orders] ADD  CONSTRAINT [DF_Orders_Discount]  DEFAULT ((0)) FOR [DiscountAmount]
GO
ALTER TABLE [dbo].[OrderStatusHistory] ADD  DEFAULT (sysdatetime()) FOR [ChangedAt]
GO
ALTER TABLE [dbo].[PasswordResets] ADD  DEFAULT ((0)) FOR [Attempts]
GO
ALTER TABLE [dbo].[PasswordResets] ADD  DEFAULT (sysdatetime()) FOR [LastSentAt]
GO
ALTER TABLE [dbo].[Payments] ADD  DEFAULT ('pending') FOR [Status]
GO
ALTER TABLE [dbo].[Payments] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[PendingRegistrations] ADD  DEFAULT ((0)) FOR [Attempts]
GO
ALTER TABLE [dbo].[PendingRegistrations] ADD  DEFAULT (sysdatetime()) FOR [LastSentAt]
GO
ALTER TABLE [dbo].[PendingRegistrations] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Refunds] ADD  DEFAULT ('pending') FOR [Status]
GO
ALTER TABLE [dbo].[Refunds] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ReturnRequests] ADD  DEFAULT ('requested') FOR [Status]
GO
ALTER TABLE [dbo].[ReturnRequests] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Reviews] ADD  CONSTRAINT [DF_Reviews_IsVisible]  DEFAULT ((1)) FOR [IsVisible]
GO
ALTER TABLE [dbo].[Reviews] ADD  CONSTRAINT [DF_Reviews_CreatedAt]  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[StockMovements] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT (getdate()) FOR [createdate]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_provider]  DEFAULT ('local') FOR [provider]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_Role]  DEFAULT ('user') FOR [Role]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_IsLocked]  DEFAULT ((0)) FOR [IsLocked]
GO
ALTER TABLE [dbo].[Vouchers] ADD  DEFAULT ((0)) FOR [MinOrder]
GO
ALTER TABLE [dbo].[Vouchers] ADD  DEFAULT ((0)) FOR [UsedCount]
GO
ALTER TABLE [dbo].[Vouchers] ADD  DEFAULT ((1)) FOR [PerUserLimit]
GO
ALTER TABLE [dbo].[Vouchers] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Vouchers] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[VoucherUsages] ADD  DEFAULT (sysdatetime()) FOR [UsedAt]
GO
ALTER TABLE [dbo].[Books]  WITH CHECK ADD FOREIGN KEY([CategoryId])
REFERENCES [dbo].[Categories] ([CategoryId])
GO
ALTER TABLE [dbo].[BookVolumes]  WITH CHECK ADD FOREIGN KEY([BookId])
REFERENCES [dbo].[Books] ([BookId])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CartItems]  WITH CHECK ADD  CONSTRAINT [FK_CartItems_Carts] FOREIGN KEY([CartId])
REFERENCES [dbo].[Carts] ([CartId])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CartItems] CHECK CONSTRAINT [FK_CartItems_Carts]
GO
ALTER TABLE [dbo].[CartItems]  WITH CHECK ADD  CONSTRAINT [FK_CartItems_Volumes] FOREIGN KEY([VolumeId])
REFERENCES [dbo].[BookVolumes] ([VolumeId])
GO
ALTER TABLE [dbo].[CartItems] CHECK CONSTRAINT [FK_CartItems_Volumes]
GO
ALTER TABLE [dbo].[Carts]  WITH CHECK ADD  CONSTRAINT [FK_Carts_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[Carts] CHECK CONSTRAINT [FK_Carts_Users]
GO
ALTER TABLE [dbo].[OrderDetails]  WITH CHECK ADD  CONSTRAINT [FK_OD_Orders] FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([OrderId])
GO
ALTER TABLE [dbo].[OrderDetails] CHECK CONSTRAINT [FK_OD_Orders]
GO
ALTER TABLE [dbo].[OrderDetails]  WITH CHECK ADD  CONSTRAINT [FK_OD_Volumes] FOREIGN KEY([VolumeId])
REFERENCES [dbo].[BookVolumes] ([VolumeId])
GO
ALTER TABLE [dbo].[OrderDetails] CHECK CONSTRAINT [FK_OD_Volumes]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Users]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Vouchers] FOREIGN KEY([VoucherId])
REFERENCES [dbo].[Vouchers] ([VoucherId])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Vouchers]
GO
ALTER TABLE [dbo].[OrderStatusHistory]  WITH CHECK ADD FOREIGN KEY([ChangedBy])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[OrderStatusHistory]  WITH CHECK ADD FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([OrderId])
GO
ALTER TABLE [dbo].[Payments]  WITH CHECK ADD  CONSTRAINT [FK_Pay_Orders] FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([OrderId])
GO
ALTER TABLE [dbo].[Payments] CHECK CONSTRAINT [FK_Pay_Orders]
GO
ALTER TABLE [dbo].[Refunds]  WITH CHECK ADD FOREIGN KEY([CompletedBy])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[Refunds]  WITH CHECK ADD FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([OrderId])
GO
ALTER TABLE [dbo].[Refunds]  WITH CHECK ADD FOREIGN KEY([ReturnId])
REFERENCES [dbo].[ReturnRequests] ([ReturnId])
GO
ALTER TABLE [dbo].[ReturnItems]  WITH CHECK ADD FOREIGN KEY([ReturnId])
REFERENCES [dbo].[ReturnRequests] ([ReturnId])
GO
ALTER TABLE [dbo].[ReturnItems]  WITH CHECK ADD FOREIGN KEY([VolumeId])
REFERENCES [dbo].[BookVolumes] ([VolumeId])
GO
ALTER TABLE [dbo].[ReturnRequests]  WITH CHECK ADD FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([OrderId])
GO
ALTER TABLE [dbo].[ReturnRequests]  WITH CHECK ADD FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD  CONSTRAINT [FK_Reviews_Books] FOREIGN KEY([BookId])
REFERENCES [dbo].[Books] ([BookId])
GO
ALTER TABLE [dbo].[Reviews] CHECK CONSTRAINT [FK_Reviews_Books]
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD  CONSTRAINT [FK_Reviews_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[Reviews] CHECK CONSTRAINT [FK_Reviews_Users]
GO
ALTER TABLE [dbo].[StockMovements]  WITH CHECK ADD FOREIGN KEY([CreatedBy])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[StockMovements]  WITH CHECK ADD FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([OrderId])
GO
ALTER TABLE [dbo].[StockMovements]  WITH CHECK ADD FOREIGN KEY([VolumeId])
REFERENCES [dbo].[BookVolumes] ([VolumeId])
GO
ALTER TABLE [dbo].[VoucherUsages]  WITH CHECK ADD FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([OrderId])
GO
ALTER TABLE [dbo].[VoucherUsages]  WITH CHECK ADD FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[VoucherUsages]  WITH CHECK ADD FOREIGN KEY([VoucherId])
REFERENCES [dbo].[Vouchers] ([VoucherId])
GO
ALTER TABLE [dbo].[Books]  WITH CHECK ADD CHECK  (([Price]>=(0)))
GO
ALTER TABLE [dbo].[BookVolumes]  WITH CHECK ADD CHECK  (([Stock]>=(0)))
GO
ALTER TABLE [dbo].[BookVolumes]  WITH CHECK ADD CHECK  (([VolumeNo]>=(1)))
GO
ALTER TABLE [dbo].[CartItems]  WITH CHECK ADD CHECK  (([Quantity]>=(1)))
GO
ALTER TABLE [dbo].[OrderDetails]  WITH CHECK ADD CHECK  (([Quantity]>(0)))
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [CK_Orders_Status] CHECK  (([Status]='cancelled' OR [Status]='delivered' OR [Status]='shipping' OR [Status]='confirmed' OR [Status]='pending'))
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [CK_Orders_Status]
GO
ALTER TABLE [dbo].[Payments]  WITH CHECK ADD CHECK  (([Method]='BANK' OR [Method]='COD'))
GO
ALTER TABLE [dbo].[Payments]  WITH CHECK ADD  CONSTRAINT [CK_Payments_Status] CHECK  (([Status]='cancelled' OR [Status]='failed' OR [Status]='paid' OR [Status]='pending'))
GO
ALTER TABLE [dbo].[Payments] CHECK CONSTRAINT [CK_Payments_Status]
GO
ALTER TABLE [dbo].[Refunds]  WITH CHECK ADD CHECK  (([Amount]>=(0)))
GO
ALTER TABLE [dbo].[Refunds]  WITH CHECK ADD CHECK  (([Reason]='return' OR [Reason]='order_cancel'))
GO
ALTER TABLE [dbo].[Refunds]  WITH CHECK ADD CHECK  (([Status]='completed' OR [Status]='pending'))
GO
ALTER TABLE [dbo].[ReturnItems]  WITH CHECK ADD CHECK  (([Quantity]>(0)))
GO
ALTER TABLE [dbo].[ReturnRequests]  WITH CHECK ADD CHECK  (([Status]='cancelled' OR [Status]='completed' OR [Status]='rejected' OR [Status]='approved' OR [Status]='requested'))
GO
ALTER TABLE [dbo].[ReturnRequests]  WITH CHECK ADD CHECK  (([Type]='exchange' OR [Type]='refund'))
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD  CONSTRAINT [CK_Reviews_Rating] CHECK  (([Rating]>=(1) AND [Rating]<=(5)))
GO
ALTER TABLE [dbo].[Reviews] CHECK CONSTRAINT [CK_Reviews_Rating]
GO
ALTER TABLE [dbo].[StockMovements]  WITH CHECK ADD  CONSTRAINT [CK_StockMovements_Reason] CHECK  (([Reason]='exchange' OR [Reason]='return' OR [Reason]='order_cancel' OR [Reason]='order' OR [Reason]='damaged' OR [Reason]='adjust' OR [Reason]='import' OR [Reason]='initial'))
GO
ALTER TABLE [dbo].[StockMovements] CHECK CONSTRAINT [CK_StockMovements_Reason]
GO
ALTER TABLE [dbo].[Vouchers]  WITH CHECK ADD CHECK  (([DiscountType]='fixed' OR [DiscountType]='percent'))
GO
ALTER TABLE [dbo].[Vouchers]  WITH CHECK ADD CHECK  (([DiscountValue]>(0)))
GO

/* ---- Tài khoản admin mẫu: email admin@mangia.local / mật khẩu Admin@123 ---- */
SET IDENTITY_INSERT [dbo].[Users] ON
INSERT [dbo].[Users] ([id], [fullName], [email], [password], [provider], [Role], [IsLocked])
VALUES (1, N'Quản trị viên', N'admin@mangia.local', N'$2b$10$s/1nGhRn961hpkezyQzU0ufzIy2ttDC6UdTtbieCsQ1ZYU2SOI5qK', N'local', N'admin', 0)
SET IDENTITY_INSERT [dbo].[Users] OFF
GO
