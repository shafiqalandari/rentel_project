# Device login update

- New devices and new browser sessions require email and password.
- The previous localStorage token is ignored.
- Successful sign-in lasts for the current browser tab session (sessionStorage), including refresh.
- Log out removes the session.
- Default demo email: admin@gmail.com; demo password: mynameisadmin.
- Records stay in existing localStorage key; no migration.
- This is only a convenience gate. Because credentials and records are on the client, this is not secure authentication for production or sensitive financial data. Use server-side authentication and a database for that.
