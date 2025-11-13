import express from 'express';
import { db } from '../db/index.js';
import { employees, attendance, requests } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { isAuthenticated, hasRole } from '../middleware/auth.js';

const router = express.Router();

// Get employee profile
router.get('/profile', isAuthenticated, hasRole('employee'), async (req, res) => {
  try {
    const user = req.user as any;

    const employee = await db.query.employees.findFirst({
      where: eq(employees.userId, user.id),
      with: {
        manager: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({ employee });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Clock in/out
router.post('/attendance/clock', isAuthenticated, hasRole('employee'), async (req, res) => {
  try {
    const user = req.user as any;
    const { action } = req.body; // 'in' or 'out'

    const employee = await db.query.employees.findFirst({
      where: eq(employees.userId, user.id),
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.employeeId, employee.id),
        gte(attendance.date, today)
      ),
    });

    if (action === 'in') {
      if (todayAttendance && todayAttendance.clockIn) {
        return res.status(400).json({ error: 'Already clocked in today' });
      }

      if (todayAttendance) {
        await db.update(attendance)
          .set({ clockIn: new Date() })
          .where(eq(attendance.id, todayAttendance.id));
      } else {
        await db.insert(attendance).values({
          employeeId: employee.id,
          date: new Date(),
          clockIn: new Date(),
          status: 'present',
        });
      }

      res.json({ message: 'Clocked in successfully' });
    } else if (action === 'out') {
      if (!todayAttendance || !todayAttendance.clockIn) {
        return res.status(400).json({ error: 'Must clock in first' });
      }

      if (todayAttendance.clockOut) {
        return res.status(400).json({ error: 'Already clocked out today' });
      }

      const clockOut = new Date();
      const hours = (clockOut.getTime() - new Date(todayAttendance.clockIn).getTime()) / (1000 * 60 * 60);

      await db.update(attendance)
        .set({
          clockOut,
          totalHours: hours.toString(),
        })
        .where(eq(attendance.id, todayAttendance.id));

      res.json({ message: 'Clocked out successfully', totalHours: hours.toFixed(2) });
    }
  } catch (error) {
    console.error('Clock error:', error);
    res.status(500).json({ error: 'Failed to clock in/out' });
  }
});

// Submit request
router.post('/requests', isAuthenticated, hasRole('employee'), async (req, res) => {
  try {
    const user = req.user as any;
    const { type, title, description, startDate, endDate, amount } = req.body;

    const employee = await db.query.employees.findFirst({
      where: eq(employees.userId, user.id),
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const [request] = await db.insert(requests).values({
      employeeId: employee.id,
      type: type as any,
      title,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      amount: amount || null,
      status: 'pending',
    }).returning();

    res.status(201).json({ request });
  } catch (error) {
    console.error('Submit request error:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// Get my requests
router.get('/requests', isAuthenticated, hasRole('employee'), async (req, res) => {
  try {
    const user = req.user as any;

    const employee = await db.query.employees.findFirst({
      where: eq(employees.userId, user.id),
      with: {
        requests: true,
      },
    });

    res.json({ requests: employee?.requests || [] });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

export default router;
