import { Router } from "express";
import { Service } from "../models/Service";
import { User } from "../models/User";
import { requireAuth } from "../middlewares/requireAuth";
import { Request, Response, NextFunction } from "express";

const router = Router();

const requireBarberOrShopOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    
    const user = await User.findById(userId);
    if (!user || (user.role !== "barber" && user.role !== "shop_owner")) {
      return res.status(403).json({ success: false, message: "Forbidden: Only barbers and shop owners can manage services" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/services/mine - List own services
router.get("/mine", requireAuth, requireBarberOrShopOwner, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const services = await Service.find({ barber: userId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: services });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
});

// POST /api/services - Create a service
router.post("/", requireAuth, requireBarberOrShopOwner, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { name, price, duration } = req.body;
    if (!name || price === undefined || !duration) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: "Price must be a number greater than 0" });
    }

    if (typeof duration !== 'string' || duration.trim() === '') {
      return res.status(400).json({ success: false, message: "Duration must be a non-empty string" });
    }

    const service = new Service({
      barber: userId,
      name,
      price,
      duration,
    });
    await service.save();

    return res.json({ success: true, data: service });
  } catch (error: any) {
    console.error("Error creating service:", error);
    return res.status(500).json({ success: false, message: "Failed to create service" });
  }
});

// PATCH /api/services/:id - Edit a service
router.patch("/:id", requireAuth, requireBarberOrShopOwner, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    const { name, price, duration, isActive } = req.body;

    if (price !== undefined) {
      if (typeof price !== 'number' || isNaN(price) || price <= 0) {
        return res.status(400).json({ success: false, message: "Price must be a number greater than 0" });
      }
    }

    if (duration !== undefined) {
      if (typeof duration !== 'string' || duration.trim() === '') {
        return res.status(400).json({ success: false, message: "Duration must be a non-empty string" });
      }
    }

    const service = await Service.findOne({ _id: id, barber: userId });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found or unauthorized" });
    }

    if (name !== undefined) service.name = name;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();
    return res.json({ success: true, data: service });
  } catch (error: any) {
    console.error("Error updating service:", error);
    return res.status(500).json({ success: false, message: "Failed to update service" });
  }
});

// DELETE /api/services/:id - Soft delete a service
router.delete("/:id", requireAuth, requireBarberOrShopOwner, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;

    const service = await Service.findOne({ _id: id, barber: userId });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found or unauthorized" });
    }

    service.isActive = false;
    await service.save();

    return res.json({ success: true, message: "Service deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return res.status(500).json({ success: false, message: "Failed to delete service" });
  }
});

export const servicesRouter = router;
