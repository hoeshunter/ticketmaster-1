-- Create an admin login (MySQL). Run AFTER mysql-schema.sql.
-- The password column must hold a BCRYPT HASH (the backend uses bcrypt.compareSync).
--
-- To generate a hash for a new password, run from the project root:
--   node -e "console.log(require('./backend/node_modules/bcryptjs').hashSync('YourPassword123', 10))"
-- then paste it below. Re-running with a new hash resets the password.

USE ticketmaster;

INSERT INTO admins (id, username, password)
VALUES (UUID(), 'myadmin', '$2a$10$J2uYaXTCfnvfaS402ZbWGuye0Avvguqn1iFHas7/G.DAtXMVoFAqS')
ON DUPLICATE KEY UPDATE password = VALUES(password);
