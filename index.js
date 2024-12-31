const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

// app.get("/", (req, res) => {
//   res.sendFile(join(__dirname, "index.html"));
// });
app.get("/", (req, res) => {
  res.render("index"); // Render the index page
});

let userSockets = {}; // Store user sockets
let adminSocket = null; // Store admin socket

io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for user registration
  socket.on("registerUser", (data) => {
    const { userId } = data;
    userSockets[userId] = socket;
    console.log(`User ${userId} connected.`);

    // Notify the user if admin is online
    if (adminSocket) {
      socket.emit("adminStatus", { online: true });
    } else {
      socket.emit("adminStatus", { online: false });
    }

    // Send the updated list of online users to the admin
    if (adminSocket) {
      const onlineUsers = Object.keys(userSockets); // Get the list of user IDs
      adminSocket.emit("onlineUsersList", onlineUsers); // Send to admin
    }
  });

  // Listen for admin registration
  socket.on("admin-register", () => {
    adminSocket = socket;
    console.log("Admin connected.");

    // Notify all connected users that the admin is online
    for (const userId in userSockets) {
      const userSocket = userSockets[userId];
      userSocket.emit("adminStatus", { online: true });
    }

    // Send the list of online users to the admin
    const onlineUsers = Object.keys(userSockets); // Get the list of user IDs
    adminSocket.emit("onlineUsersList", onlineUsers); // Send to admin
  });

  // Handle user messages to admin
  socket.on("userMessage", (data) => {
    const { userId, message } = data;
    if (adminSocket) {
      adminSocket.emit("newMessageFromUser", { userId, message });
    } else {
      console.log("No admin connected.");
    }
  });

  // Handle admin replies to user
  socket.on("adminReply", (data) => {
    const { userId, message } = data;
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit("adminReply", { message });
    } else {
      console.log(`User ${userId} is not connected.`);
    }
  });

  // Handle disconnect events
  socket.on("disconnect", () => {
    // Handle user disconnect
    for (const userId in userSockets) {
      if (userSockets[userId] === socket) {
        delete userSockets[userId];
        console.log(`User ${userId} disconnected.`);
        break;
      }
    }

    // Handle admin disconnect
    if (socket === adminSocket) {
      adminSocket = null;
      console.log("Admin disconnected.");
      // Notify all users that admin is offline
      for (const userId in userSockets) {
        const userSocket = userSockets[userId];
        userSocket.emit("adminStatus", { online: false });
      }
    }

    // Send the updated list of online users to the admin if disconnected
    if (adminSocket) {
      const onlineUsers = Object.keys(userSockets); // Get the list of user IDs
      adminSocket.emit("onlineUsersList", onlineUsers); // Send to admin
    }
  });
});

// const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();
// const http = require("http");
const cron = require("node-cron");
// const app = express();
const session = require("express-session");
// const { createServer } = require("node:http");
// const { join } = require("node:path");
// const { Server } = require("socket.io");

// const server = createServer(app);
// const io = new Server(server);

// app.get("/", (req, res) => {
//   res.sendFile(join(__dirname, "index.html"));
// });

// io.on("connection", (socket) => {
//   console.log("a user connected");
// });
// // Store connections for users and admin
// const userSockets = {}; // Mapping user ID to socket
// let adminSocket = null; // Single admin socket

// // // Handle Socket.IO connections
// // io.on("connection", (socket) => {
// //   console.log("New Socket.IO connection established.");
// // });
// /* Listen for client events
// socket.on("registerUser", (data) => {
//   const { userId } = data;
//   userSockets[userId] = socket;
//   7;
//   console.log(` User ${userId} connected.`);
// });

// socket.on("admin-register", () => {
//   adminSocket = socket;
//   console.log("Admin connected.");
// });

// socket.on("userMessage", (data) => {
//   const { userId, message } = data;
//   if (adminSocket) {
//     adminSocket.emit("newMessageFromUser", { userId, message });
//   } else {
//     console.log("No admin connected.");
//   }
// });

// socket.on("adminReply", (data) => {
//   const { userId, message } = data;
//   const userSocket = userSockets[userId];
//   if (userSocket) {
//     userSocket.emit("adminReply", { message });
//   } else {
//     console.log(`User ${userId} is not connected.`);
//   }
// });

// // Handle disconnect
// socket.on("disconnect", () => {
//   for (const userId in userSockets) {
//     if (userSockets[userId] === socket) {
//       delete userSockets[userId];
//       console.log(`User ${userId} disconnected. `);
//       return;
//     }
//   }
//   if (socket === adminSocket) {
//     adminSocket = null;
//     console.log("Admin disconnected.");
//   }
// });
// //}); */

// // Set EJS as the view engine
app.set("view engine", "ejs");

// // Set the views directory
app.set("views", path.join(__dirname, "views"));

// // Serve static files (for CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// // Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// // Setup session middleware
app.use(
  session({
    secret: "your-secret-key", // Replace with a strong secret key
    resave: false, // Don't save session if it wasn't modified
    saveUninitialized: true, // Save empty session objects
    cookie: { secure: false }, // Use true if you're using HTTPS, false for HTTP
  })
);

// // Middleware to parse cookies
app.use(cookieParser());

// // Root route - User Chat Page
app.get("/user-chat", (req, res) => {
  res.render("user-chat", { userId: 435 }); // Example user ID, this could be dynamic
});

// // Admin route - Admin Dashboard
app.get("/admin-chat", (req, res) => {
  res.render("admin-chat");
});

// // PostgreSQL connection

require("dotenv").config(); // To load the DATABASE_URL from .env file

// // Create a new pool instance for PostgreSQL connection

// // Create the pool for database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Adjust SSL settings based on your environment
  },
});

async function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users1 (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      referral_code VARCHAR(50) UNIQUE NOT NULL,
      referred_by VARCHAR(50),
      balance DECIMAL DEFAULT 0
    );
  `;
  const createPayTable = `
    CREATE TABLE IF NOT EXISTS payment (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      hashID VARCHAR(255) NOT NULL,
      address VARCHAR(100) NOT NULL,
      interest DECIMAL(5, 2) NOT NULL, -- Interest as a percentage, e.g., 5.00 for 5%
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      approved_by INT,
      approved_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users1(id)
    );
  `;
  const createWithdrawTable = `
    CREATE TABLE IF NOT EXISTS withdraw (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      hashID VARCHAR(255) NOT NULL,
      address VARCHAR(100) NOT NULL,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      approved_by INT,
      approved_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users1(id)
    );
  `;

  try {
    // Execute the SQL queries to create the tables
    await pool.query(createUsersTable);
    await pool.query(createPayTable);
    await pool.query(createWithdrawTable);
    console.log("Tables created (if not already exist)");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}

// Function to increase user balance according to interest
async function increaseBalance() {
  try {
    // Fetch all users' interest and their balance from the payment table
    const result = await pool.query(`
      SELECT u.id, u.balance, p.interest
      FROM users1 u
      LEFT JOIN payment p ON u.id = p.user_id
      WHERE p.status = 'Approved'
    `);

    const users = result.rows;

    // Update each user's balance based on their interest rate
    for (let user of users) {
      const interestRate = user.interest || 0; // Default to 0 if no interest is found
      const newBalance = user.balance * (1 + interestRate / 100); // Calculate new balance with interest
      await pool.query(
        `
        UPDATE users1
        SET balance = $1
        WHERE id = $2
      `,
        [newBalance, user.id]
      );
    }

    console.log("User balances updated successfully");
  } catch (err) {
    console.error("Error updating balances:", err);
  }
}

// Create tables initially
createTables();

// Schedule the balance increase every 24 hours (once per day at midnight)
cron.schedule("0 0 * * *", increaseBalance);

// Middleware to check if user is authenticated
function checkAuthCookie(req, res, next) {
  const token = req.cookies.token;

  if (token) {
    return res.redirect("dashboard");
    // Redirect to dashboard if cookie exists
  }

  next(); // Proceed to next middleware or route if no cookie
}

// Middleware to authenticate user by token
function authenticateToken(req, res, next) {
  const token = req.cookies.token; // Get token from cookies

  if (!token) return res.redirect("index"); // Redirect to index if token is missing

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.redirect("index"); // Redirect to index if token is invalid
    req.user = user;
    next();
  });
}

// // Root Route

app.get("/signup", checkAuthCookie, (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  console.log("Request body:", req.body); // Log incoming data

  const { username, email, password, referral_code } = req.body;

  // Check if all required fields are provided
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  try {
    // Check if the email is already in use
    const { rows: existingUsers } = await pool.query(
      "SELECT * FROM users1 WHERE email = $1",
      [email]
    );
    if (existingUsers.length > 0) {
      return res.render("error", { error: "Email is already in use" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    let referredBy = null;

    // Handle referral code, if provided
    if (referral_code) {
      const { rows: referrer } = await pool.query(
        "SELECT * FROM users1 WHERE referral_code = $1",
        [referral_code]
      );
      if (referrer.length > 0) {
        referredBy = referral_code;
        // Update the referrer's balance
        await pool.query(
          "UPDATE users1 SET balance = balance + 50 WHERE referral_code = $1",
          [referral_code]
        );
      }
    }

    // Generate a unique referral code for the new user
    const newReferralCode =
      email.split("@")[0] + Math.floor(Math.random() * 1000);

    // Insert the new user into the database
    await pool.query(
      "INSERT INTO users1 (username, email, password, referral_code, referred_by, balance) VALUES ($1, $2, $3, $4, $5, $6)",
      [username, email, hashedPassword, newReferralCode, referredBy, 0]
    );

    // If you want to redirect the user to the login page after successful signup
    // Make sure the redirection works, or alternatively, return a success message.
    res.redirect("/login"); // Adjust this if it's an API or client-side redirect.
  } catch (error) {
    console.error("Sign-up error:", error);
    return res.render("error", { error: "Email during sign-up" });
  }
});

app.get("/login", checkAuthCookie, (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  console.log("Request body:", req.body); // Log incoming data

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { rows: users } = await pool.query(
      "SELECT * FROM users1 WHERE email = $1",
      [email]
    );
    if (users.length === 0) {
      return res.render("error1", { error: "Invalid email or password" });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      // Store the token in an HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      // Redirect to the dashboard
      return res.redirect("dashboard");
    } else {
      res.render("error1", { error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.render("error1", { error: "Error during login" });
  }
});

app.get("/dashboard", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming req.user is populated by authentication middleware

  try {
    // Fetch the user data (balance, interest rate, active deposit, withdrawn)

    const result = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.username,
        u.balance,
        u.referral_code,
        COALESCE(SUM(p.interest), 0) AS total_interest,  -- Calculate total interest
        COALESCE(SUM(p.amount), 0) AS active_deposit,    -- Calculate total active deposits
        COALESCE(SUM(w.amount), 0) AS withdrawn          -- Calculate total withdrawn amounts
      FROM
        users1 u
      LEFT JOIN
        payment p ON u.id = p.user_id AND p.status = 'Approved'
      LEFT JOIN
        withdraw w ON u.id = w.user_id AND w.status = 'Approved'
      WHERE
        u.id = $1
      GROUP BY
        u.id;
    `,
      [userId]
    );
    console.log("Query Result:", result.rows);

    if (result.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    const userData = result.rows[0]; // Only one user will be returned

    let balance = parseFloat(userData.balance);
    let totalInterest = parseFloat(userData.total_interest);
    let activeDeposit = parseFloat(userData.active_deposit);
    let withdrawn = parseFloat(userData.withdrawn);

    // Calculate the daily profit based on the user's balance and total interest
    const profit = balance - activeDeposit;

    // Calculate the new balance after adding the profit
    //const newBalance = balance + profit;

    // Optionally, update the user's balance in the database if you want to persist the new balance
    //await pool.query(
    ///   `
    //  UPDATE users1
    //   SET balance = $1
    //   WHERE id = $2
    //  `,
    //  [newBalance, userId]
    // );
    //console.log(newBalance);
    console.log(profit);

    // Render the updated user data to the dashboard
    res.render("dashboard", {
      user: {
        ...userData,
        profit,
      },
      referralCode: userData.referral_code,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.render("error", { error: "Error fetching dashboard data" });
  }
});

app.get("/deposit", (req, res) => {
  res.render("deposit");
});

app.post("/deposit", (req, res) => {
  console.log("Request body:", req.body);
  const { plan, amount, method, interest } = req.body;
  if (!plan || !amount || !method) {
    res.render("error", { error: "form not complete" });
  }
  try {
    if (method === "btc") {
      res.render("payAddress", {
        img: "./uploads/gateway/btc-address.jpg",
        address: "bc1qjwa8rkkpfh4r36uh4eqqdwn9ujtw7hpn88g82x",
        amount,
        interest,
      });
    } else if (method === "tron") {
      res.render("payAddress", {
        img: " ./uploads/gateway/trx-address.jpg ",
        address: "TUbEq2AMTnS5WYLWCYiYjF3BWj2hqLDoLG",
        amount,
        interest,
      });
    } else if (method === "usdt") {
      res.render("payAddress", {
        img: " ./uploads/gateway/usdt-address.jpg",
        address: "0xc679210d855fFf3AA525E833C94dc5B6bf6F3EF4",
        amount,
        interest,
      });
    } else {
      console.log("error");
    }
  } catch (error) {
    console.log("Error occurred:", error);
  }
});

app.post("/confirm", authenticateToken, async (req, res) => {
  const { amount, hashId, address, interest } = req.body;
  console.log(req.body);
  // Basic validation
  try {
    // Proceed to update the user's balance and insert the withdrawal record
    //await pool.query("UPDATE users1 SET balance = balance + $1 WHERE id = $2", [
    //  amount,
    // req.user.userId,
    /// ]);

    const query = `
        INSERT INTO payment (user_id, amount,  hashID ,address ,interest )
        VALUES ($1, $2, $3 ,$4 ,$5)
        RETURNING id;
      `;
    const values = [req.user.userId, amount, hashId, address, interest];

    const result = await pool.query(query, values);
    const { rows: withdrawal } = await pool.query(
      "SELECT * FROM withdraw WHERE user_id = $1 ",
      [req.user.userId]
    );
    const { rows: payments } = await pool.query(
      "SELECT * FROM payment WHERE user_id = $1",
      [req.user.userId]
    );

    // Log the results from the query
    console.log("Payments:", payments);
    console.log("Withdrawals:", withdrawal);

    // After successful withdrawal, render the history page
    res.render("history", { payments: payments, withdrawal: withdrawal });
  } catch (err) {
    console.error("Error submitting payment:", err);
    res.render("error", { error: "Internal server error" });
  }
});

app.get("/history", authenticateToken, async (req, res) => {
  try {
    const { rows: withdrawal } = await pool.query(
      "SELECT * FROM withdraw WHERE user_id = $1 ",
      [req.user.userId]
    );
    const { rows: payments } = await pool.query(
      "SELECT * FROM payment WHERE user_id = $1",
      [req.user.userId]
    );
    res.render("history", { payments: payments, withdrawal: withdrawal });

    // Log the results from the query
    console.log("Payments:", payments);
    console.log("Withdrawals:", withdrawal);
  } catch (error) {
    console.error("Error submitting payment:", err);
    res.render("error", { error: "Internal server error" });
  }
});

//chat
app.get("/chart", (req, res) => {
  res.render("chart");
});

app.get("/withdraw", authenticateToken, (req, res) => {
  // At this point, req.user is guaranteed to be set if the token is valid
  const userId = req.user.userId; // Example: Assuming user object contains userId

  res.render("withdraw", { userId: userId });
});

app.post("/withdraw", authenticateToken, async (req, res) => {
  const { userId, amount, hashID, address } = req.body;
  //const userId = req.user.userId;
  // Fetch user's  current balance
  const { rows: users1 } = await pool.query(
    "SELECT balance FROM users1 WHERE id = $1",
    [req.user.userId]
  );

  // Basic validation
  if (!userId || !amount || !hashID || !address) {
    return res.render("error", { error: "Missing required fields" });
  } else if (users1.length === 0 || users1[0].balance <= amount) {
    // Check if the balance is sufficient for withdrawal
    return res.render("error", { error: "Insufficient funds" });
  } else
    try {
      // Proceed to update the user's balance and insert the withdrawal record
      //  await pool.query(
      //   "UPDATE users1 SET balance = balance - $1 WHERE id = $2",
      //   [amount, req.user.userId]
      // );

      const query = `
      INSERT INTO withdraw (user_id, amount,  hashID , address)
      VALUES ($1, $2, $3 ,$4 )
      RETURNING id;
    `;
      const values = [userId, amount, hashID, address];

      const result = await pool.query(query, values);

      // After successful withdrawal, render the history page
      const { rows: withdrawal } = await pool.query(
        "SELECT * FROM withdraw WHERE user_id = $1",
        [req.user.userId]
      );
      const { rows: payments } = await pool.query(
        "SELECT * FROM payment WHERE user_id = $1",
        [req.user.userId]
      );

      // Log the results from the query
      console.log("Payments:", payments);
      console.log("Withdrawals:", withdrawal);

      // After successful withdrawal, render the history page
      res.render("history", { payments: payments, withdrawal: withdrawal });
    } catch (err) {
      console.log("Error processing withdrawal:", err);
      res.render("error", { error: "Internal server error" });
    }
});

// Approve payment by Admin
app.post("/admin/payment/:id/:user_id/:amount/approve", async (req, res) => {
  const { id, user_id, amount } = req.params;

  console.log("Params:", req.params);

  try {
    // Update the payment status to "Approved"
    await pool.query("UPDATE payment SET status = $1 WHERE id = $2", [
      "Approved",
      id,
    ]);

    // Update the user's balance by adding the approved amount
    await pool.query("UPDATE users1 SET balance = balance + $1 WHERE id = $2", [
      amount,
      user_id,
    ]);

    // Redirect to the admin dashboard after approval
    res.redirect("/admin-dashboard");
  } catch (error) {
    console.error("Approval error:", error);
    return res.render("error", {
      error: "Payment not found or already approved/rejected",
    });
  }
});

// Rejected payment by Admin
app.post("/admin/payment/:id/reject", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("UPDATE payment SET status = $1 WHERE id = $2", [
      "rejected",
      id,
    ]);

    res.redirect("/admin-dashboard"); // Redirect to the withdrawals list after approval
  } catch (error) {
    console.error("Approval error:", error);
    return res.render("error", {
      error: "Payment not found or already approved/rejected",
    });
  }
});

// Approve Withdrawal by Admin
app.post("/admin/withdrawal/:id/:user_id/:amount/approve", async (req, res) => {
  const { id } = req.params;
  const { amount } = req.params;
  const { user_id } = req.params;
  console.log(req.params);
  try {
    await pool.query("UPDATE withdraw SET status = $1 WHERE id = $2 ", [
      "Approved",
      id,
    ]);
    await pool.query("UPDATE users1 SET balance = balance - $1 WHERE id = $2", [
      amount,
      user_id,
    ]);
    res.redirect("/admin-dashboard"); // Redirect to the withdrawals list after approval
  } catch (error) {
    console.error("Approval error:", error);
    return res
      .status(500)
      .render("error", { message: "Error approving withdrawal" });
  }
});

// reject Withdrawal by Admin
app.post("/admin/withdrawals/:id/reject", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE withdraw SET status = $1 WHERE id = $2", [
      "Rejected",
      id,
    ]);
    res.redirect("/admin-dashboard"); // Redirect to the withdrawals list after approval
  } catch (error) {
    console.error("Rejected error:", error);
    res.status(500).render("error", { message: "Error rejecting withdrawal" });
  }
});

app.get("/admin-login", (req, res) => {
  res.render("admin-login");
});
``;
// Middleware to check if the user is logged in as admin
function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next(); // Proceed to the next middleware or route
  }
  return res.redirect("/admin-login"); // Redirect to login if not logged in
}

// Use the middleware for routes that require admin authentication

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate user by JWT token
function authenticateToken2(req, res, next) {
  const token = req.cookies.token; // Get token from cookies

  if (!token) {
    if (!token) return res.redirect("index"); // Redirect to index if token is missing
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err) return res.redirect("index"); // Redirect to index if token is invalid
    }
    req.user = user; // Attach user data to request object
    next();
  });
}

// Middleware to check if the user is already logged in
function checkAuthCookie2(req, res, next) {
  const token = req.cookies.token;

  if (token) {
    return res.redirect("/admin-dashboard");
  }

  next();
}

// admin-login route
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD; // Password from env
  const adminUsername = process.env.AMIN_USERNAME; // Username from env

  // Log the inputs for debugging (optional)
  console.log(username);
  console.log(password);
  console.log(adminPassword);
  console.log(adminUsername);

  // Basic validation for username and password
  if (adminUsername === username && adminPassword === password) {
    // Set session data for admin login
    req.session.isAdmin = true; // Set isAdmin flag to true for this session
    req.session.user = { username: username, role: "admin" }; // Store the user data

    // Optionally, you could generate a JWT token and store it in a cookie if needed (currently commented out)
    // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    // res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    ///console.log('Admin logged in successfully');
    res.redirect("admin-dashboard"); // Redirect to the admin dashboard page
  } else {
    // If login fails, render an error page
    res.render("error2", { error: "Invalid username or password" });
  }
});

// Middleware to check if the user is logged in as admin
function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next(); // Proceed to the next middleware or route
  }
  return res.redirect("/admin-login"); // Redirect to login if not logged in
}

// Use the middleware for routes that require admin authentication

app.get("/admin-dashboard", isAdmin, async (req, res) => {
  try {
    const { rows: withdrawals } = await pool.query("SELECT * FROM withdraw ");
    const { rows: users1 } = await pool.query("SELECT * FROM users1");
    const { rows: payment } = await pool.query("SELECT * FROM payment");

    // const query = 'SELECT * FROM payment WHERE status = $1';
    // const { rows: payment } = await pool.query(query, ['pending']);
    console.log(payment, users1, withdrawals);
    res.render("admin-dashboard", { payment, users1, withdrawals });
  } catch (err) {
    console.error("Error fetching pending payments:", err);
    return res.render("error", {
      error: "Error fetching pending payments:",
      err,
    });
  }
});

// Route for logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Failed to destroy session");
    }
    res.clearCookie("connect.sid"); // clears the session cookie
    res.redirect("/"); // or wherever you want to redirect
  });
});

// // Start the server
const PORT = process.env.PORT;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

server.listen(PORT, () => {
  console.log("server running at http://localhost:3000");
});
