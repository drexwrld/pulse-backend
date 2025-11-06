import { Hono } from "hono";
import { prisma } from "../db.js";

const adminRoutes = new Hono();

// 🧠 1️⃣ Get all users pending HOC approval
adminRoutes.get("/pending-hocs", async (c) => {
  try {
    const pending = await prisma.user.findMany({
      where: { isHOCPending: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        academicYear: true,
        role: true,
        isHOC: true,
        isHOCPending: true,
      },
    });

    return c.json({ success: true, pending });
  } catch (error) {
    console.error("Fetch pending HOCs error:", error);
    return c.json({ error: "Failed to fetch pending HOCs" }, 500);
  }
});

// 🧩 2️⃣ Approve a specific HOC user
adminRoutes.patch("/approve-hoc/:userId", async (c) => {
  try {
    const userId = Number(c.req.param("userId"));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return c.json({ error: "User not found" }, 404);

    if (!user.isHOCPending)
      return c.json({ error: "User is not pending approval" }, 400);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isHOC: true,
        isHOCPending: false,
      },
    });

    return c.json({
      success: true,
      message: "HOC approved successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Approve HOC error:", error);
    return c.json({ error: "Failed to approve HOC" }, 500);
  }
});

export default adminRoutes;
