const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const userService = require("./userService");
const { hashPassword, comparePassword } = require("../utils/hash");

const JWT_SECRET = process.env.JWT_SECRET || "Password123!!!";

module.exports = {
  async register(data) {
    const { email, password, name, role_id, role_name } = data;

    if (!email || !password || !name) {
      const err = new Error("Missing required fields: email, password, name");
      err.status = 400;
      throw err;
    }

    const existing = await userService.getUserByEmail(email);
    if (existing) {
      const err = new Error("Email already in use");
      err.status = 409;
      throw err;
    }

    // Resolve role_id: prefer explicit role_id, then role_name, then default role "student"
    let resolvedRoleId = null;

    if (role_id) {
      const r = await prisma.auth_role.findUnique({ where: { id: role_id } });
      if (!r) {
        const err = new Error("Role not found for provided role_id");
        err.status = 400;
        throw err;
      }
      resolvedRoleId = r.id;
    } else if (role_name) {
      const r = await prisma.auth_role.findUnique({ where: { name: role_name } });
      if (!r) {
        const err = new Error(`Role not found for provided role_name: ${role_name}`);
        err.status = 400;
        throw err;
      }
      resolvedRoleId = r.id;
    } else {
      // No role provided — use default "student" (create if missing)
      let defaultRole = await prisma.auth_role.findUnique({ where: { name: "student" } });
      if (!defaultRole) {
        defaultRole = await prisma.auth_role.create({ data: { name: "student" } });
      }
      resolvedRoleId = defaultRole.id;
    }

    const hashed = await hashPassword(password);

    const user = await userService.createUser({
      email,
      name,
      password_hash: hashed,
      role_id: resolvedRoleId,
    });

    return  {message: "User registered successfully"};
  },

  async login({ email, password }) {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });
    return { user, token };
  },
};