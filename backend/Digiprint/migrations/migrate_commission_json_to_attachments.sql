/*
  Chạy trên DB đã có cột commissions.attached_files (JSON) hoặc không.
  Bước 1: tạo bảng commission_attachments nếu chưa có.
  Bước 2: (tùy chọn) migrate JSON sang bảng — cần script CLR hoặc làm tay; app mới không dùng JSON nữa.
  Bước 3: DROP cột attached_files nếu tồn tại.
*/

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'commission_attachments')
BEGIN
    CREATE TABLE commission_attachments (
        commission_attachment_id INT IDENTITY(1, 1) PRIMARY KEY,
        commission_id INT NOT NULL,
        storage_path NVARCHAR(500) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        CONSTRAINT fk_commission_attachment_commission
            FOREIGN KEY (commission_id)
            REFERENCES commissions(commission_id)
            ON DELETE CASCADE
    );
END
GO

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.commissions') AND name = 'attached_files'
)
BEGIN
    ALTER TABLE commissions DROP COLUMN attached_files;
END
GO
