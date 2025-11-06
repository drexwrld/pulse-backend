import { Request, Response } from "express";
import { User } from "../models/User";

export const approveHOC = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isHOCPending)
      return res.status(400).json({ error: "User is not pending approval" });

    user.isHOC = true;
    user.isHOCPending = false;

    await user.save();

    res.json({ message: "HOC approved successfully", user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
