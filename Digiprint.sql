DROP DATABASE IF EXISTS Digiprint;
GO

CREATE DATABASE Digiprint;
GO

USE Digiprint;
GO

CREATE TABLE accounts (
    account_id INT IDENTITY(1, 1) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    role VARCHAR(50) NULL
);

CREATE TABLE users (
    user_id INT IDENTITY(1, 1) PRIMARY KEY,
    background_image_url VARCHAR(500) NULL,
    image_url VARCHAR(500) NULL,
    username VARCHAR(255) NULL UNIQUE,
    first_name VARCHAR(255) NULL,
    last_name VARCHAR(255) NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(50) NULL,
    location VARCHAR(255) NULL,
    biography VARCHAR(255) NULL,
    account_id INT NULL UNIQUE,

    CONSTRAINT fk_user_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
);

CREATE TABLE tags (
    tag_id INT IDENTITY(1, 1) PRIMARY KEY,
    tag_name VARCHAR(255) NULL UNIQUE,
    tag_description VARCHAR(255) NULL,
    tag_work_count INT NOT NULL DEFAULT 0,
    tag_genre VARCHAR(50) NULL
);

CREATE TABLE works (
    work_id INT IDENTITY(1, 1) PRIMARY KEY,
    genre VARCHAR(50) NULL,
    work_source VARCHAR(500) NULL,
    thumbnail VARCHAR(500) NULL,
    work_title VARCHAR(500) NULL,
    work_description VARCHAR(255) NULL,
    rating VARCHAR(50) NULL,
    work_upload_date DATETIME2(6) NULL,
    user_id INT NULL,
    like_count INT NULL DEFAULT 0,

    CONSTRAINT fk_work_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE work_tags (
    work_id INT NOT NULL,
    tag_id INT NOT NULL,

    PRIMARY KEY (work_id, tag_id),

    CONSTRAINT fk_worktag_work
        FOREIGN KEY (work_id)
        REFERENCES works(work_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_worktag_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(tag_id)
        ON DELETE CASCADE
);

CREATE TABLE likes (
    user_id INT NOT NULL,
    work_id INT NOT NULL,

    PRIMARY KEY (user_id, work_id),

    CONSTRAINT fk_like_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_like_work
        FOREIGN KEY (work_id)
        REFERENCES works(work_id)
        ON DELETE CASCADE
);

CREATE TABLE favorites (
    user_id INT NOT NULL,
    work_id INT NOT NULL,

    PRIMARY KEY (user_id, work_id),

    CONSTRAINT fk_favorite_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_favorite_work
        FOREIGN KEY (work_id)
        REFERENCES works(work_id)
        ON DELETE CASCADE
);

CREATE TABLE comments (
    comment_id INT IDENTITY(1, 1) PRIMARY KEY,
    work_id INT NOT NULL,
    user_id INT NOT NULL,
    reply_to_id INT NULL,
    comment_content VARCHAR(2000) NOT NULL,
    comment_date DATETIME2(6) NOT NULL,

    CONSTRAINT fk_comment_work
        FOREIGN KEY (work_id)
        REFERENCES works(work_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_comment_reply
        FOREIGN KEY (reply_to_id)
        REFERENCES comments(comment_id)
);

CREATE TABLE follows (
    user_id INT NOT NULL,
    artist_id INT NOT NULL,

    PRIMARY KEY (user_id, artist_id),

    CONSTRAINT fk_follow_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_follow_artist
        FOREIGN KEY (artist_id)
        REFERENCES users(user_id)
);

CREATE TABLE commissions (
    commission_id INT IDENTITY(1, 1) PRIMARY KEY,
    commission_type VARCHAR(255) NULL,
    commission_description VARCHAR(255) NULL,
    commission_price INT NOT NULL,
    genre VARCHAR(50) NULL,
    user_id INT NULL,

    CONSTRAINT fk_commission_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

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

CREATE TABLE orders (
    order_id INT IDENTITY(1, 1) PRIMARY KEY,
    customer_account_id INT NULL,
    price FLOAT NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    created_at DATETIME2(6) NOT NULL,
    completed_at DATETIME2(6) NULL,

    CONSTRAINT fk_order_customer_account
        FOREIGN KEY (customer_account_id)
        REFERENCES accounts(account_id)
);

CREATE TABLE order_items (
    order_item_id INT IDENTITY(1, 1) PRIMARY KEY,
    order_id INT NOT NULL,
    commission_id INT NOT NULL,
    commission_type_snapshot VARCHAR(255) NULL,
    genre_snapshot VARCHAR(50) NULL,
    unit_price_snapshot INT NULL,
    quantity INT NOT NULL,

    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_item_commission
        FOREIGN KEY (commission_id)
        REFERENCES commissions(commission_id)
);

CREATE TABLE payments (
    payment_id INT IDENTITY(1, 1) PRIMARY KEY,
    order_id INT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'VNPAY',
    txn_ref VARCHAR(100) NOT NULL UNIQUE,
    amount BIGINT NOT NULL,
    bank_code VARCHAR(50) NULL,
    order_info VARCHAR(500) NULL,
    payment_url VARCHAR(2000) NULL,
    vnp_response_code VARCHAR(20) NULL,
    vnp_transaction_no VARCHAR(100) NULL,
    vnp_transaction_status VARCHAR(20) NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME2(6) NOT NULL,
    paid_at DATETIME2(6) NULL,
    raw_callback_payload NVARCHAR(MAX) NULL,

    CONSTRAINT fk_payment_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

CREATE TABLE artist_applications (
    application_id INT IDENTITY(1, 1) PRIMARY KEY,
    account_id INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    reason VARCHAR(2000) NULL,
    applicant_message VARCHAR(2000) NULL,
    requested_at DATETIME2(6) NOT NULL,
    processed_at DATETIME2(6) NULL,

    CONSTRAINT fk_artist_application_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
);
GO

INSERT INTO accounts (email, password, role) VALUES
('admin@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'ADMIN'),
('yuki@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'ARTIST'),
('chuuni@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'ARTIST'),
('taiyo@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'ARTIST'),
('na@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'ARTIST'),
('trang@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'ARTIST'),
('kirara@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'ARTIST'),
('aprila@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'USER'),
('tabi@digiprint.com', '$2a$10$OkRYTqmc72c6x9QD5PVJBeiBT7CL3PIeMlyIzcJbJzPPUL6Dwu5sO', 'USER');

SELECT * FROM accounts;

INSERT INTO users (username, first_name, last_name, gender, location, biography, account_id)
VALUES
('admin', 'System', 'Admin', 'OTHER', 'Server', 'Administrator account', 1),
('yuki_nyakeri', 'Yuki', 'Nyayaki', 'FEMALE', 'Japan', 'Anime illustrator', 2),
('chuuni_chinori', 'Chuuni', 'Chinori', 'FEMALE', 'Vietnam', 'Concept artist', 3),
('torio_taiyo', 'Torio', 'Taiyo', 'MALE', 'Vietnam', 'Chibi specialist', 4),
('nakamira', 'Truong', 'Ngoc', 'FEMALE', 'Vietnam', 'VGen artist', 5),
('kano', 'Linh', 'Trang', 'FEMALE', 'Vietnam', 'VGen artist', 6),
('kirara_magic', 'Kirara', 'Magic', 'MALE', 'Philippines', 'Electronic music producer', 7),
('aprilaracle', 'Aprila', 'Yuugure', 'MALE', 'England', 'Art fan', 8),
('tabitabi', 'Tabi', 'Kazerata', 'FEMALE', 'France', 'Anime lover', 9);


