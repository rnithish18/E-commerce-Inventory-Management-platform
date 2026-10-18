INSERT INTO inventory
(product_id, quantity, reserved_quantity, reorder_level)
VALUES
(1, 20, 0, 5),
(2, 50, 0, 10),
(3, 30, 0, 5),
(4, 100, 0, 20),
(5, 40, 0, 10);

SELECT * FROM inventory;