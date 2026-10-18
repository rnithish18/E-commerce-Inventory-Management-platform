CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, description)
VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Men and women clothing'),
('Books', 'Books and educational materials'),
('Home & Kitchen', 'Home and kitchen products'),
('Sports', 'Sports equipment and accessories');