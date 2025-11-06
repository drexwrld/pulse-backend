import { Hono } from "hono";
import { prisma } from "../db.js";

const adminRoutes = new Hono();

// ✅ Approve a pending HOC
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
