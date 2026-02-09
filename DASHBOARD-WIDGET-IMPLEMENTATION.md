# 📊 Dashboard Widget - Implementation Guide

## Method 4: Real-time Visual Monitoring in Admin Dashboard

---

## 🎯 What You'll Get:

### **Live Dashboard Widget:**
```
Your CRM Dashboard → New "Server Health" Card
Shows:
✅ Disk usage percentage (with progress bar)
✅ Used vs Total space
✅ Visual status (Green/Yellow/Red)
✅ Real-time updates
✅ 7-day trend graph
✅ Auto-refresh every 5 minutes
```

---

## 💻 **Backend Code:**

### **Step 1: Create System Health Module**

**File:** `backend/src/system/system.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
```

---

### **Step 2: Create System Service**

**File:** `backend/src/system/system.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class SystemService {
  async getDiskUsage() {
    try {
      // Get disk usage info
      const { stdout } = await execAsync('df -h / | tail -1');
      const parts = stdout.trim().split(/\s+/);

      const total = parts[1];
      const used = parts[2];
      const available = parts[3];
      const percentageStr = parts[4];
      const percentage = parseInt(percentageStr.replace('%', ''));

      // Determine status
      let status: 'healthy' | 'warning' | 'critical';
      let statusText: string;
      let color: string;

      if (percentage < 70) {
        status = 'healthy';
        statusText = 'Healthy';
        color = '#10b981'; // green
      } else if (percentage < 85) {
        status = 'warning';
        statusText = 'Warning - Plan to increase soon';
        color = '#f59e0b'; // yellow
      } else {
        status = 'critical';
        statusText = 'Critical - Increase NOW!';
        color = '#ef4444'; // red
      }

      return {
        total,
        used,
        available,
        percentage,
        status,
        statusText,
        color,
        checkedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to get disk usage: ${error.message}`);
    }
  }

  async getMemoryUsage() {
    try {
      const { stdout } = await execAsync('free -h | grep Mem');
      const parts = stdout.trim().split(/\s+/);

      return {
        total: parts[1],
        used: parts[2],
        free: parts[3],
        percentage: Math.round((parseFloat(parts[2]) / parseFloat(parts[1])) * 100),
      };
    } catch (error) {
      return null;
    }
  }

  async getCPUUsage() {
    try {
      // Get load average
      const { stdout } = await execAsync('uptime');
      const loadAvg = stdout.match(/load average: ([\d.]+)/)?.[1];

      return {
        loadAverage: loadAvg,
      };
    } catch (error) {
      return null;
    }
  }

  async getSystemHealth() {
    const disk = await this.getDiskUsage();
    const memory = await this.getMemoryUsage();
    const cpu = await this.getCPUUsage();

    return {
      disk,
      memory,
      cpu,
      timestamp: new Date(),
    };
  }
}
```

---

### **Step 3: Create API Controller**

**File:** `backend/src/system/system.controller.ts`
```typescript
import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async getSystemHealth() {
    return this.systemService.getSystemHealth();
  }

  @Get('disk')
  async getDiskUsage() {
    return this.systemService.getDiskUsage();
  }
}
```

---

### **Step 4: Register Module**

**File:** `backend/src/app.module.ts`
```typescript
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    // ... existing imports
    SystemModule, // Add this
  ],
})
export class AppModule {}
```

---

## 🎨 **Frontend Code:**

### **Step 5: Create Dashboard Widget Component**

**File:** `frontend/src/components/ServerHealthWidget.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiskUsage {
  total: string;
  used: string;
  available: string;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
  statusText: string;
  color: string;
  checkedAt: string;
}

export function ServerHealthWidget() {
  const [diskUsage, setDiskUsage] = useState<DiskUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiskUsage();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDiskUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDiskUsage = async () => {
    try {
      const response = await fetch('/api/system/disk');
      const data = await response.json();
      setDiskUsage(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch disk usage:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💾 Server Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!diskUsage) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>💾 Server Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disk Usage Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Disk Usage</span>
            <span className="text-sm font-medium">{diskUsage.percentage}%</span>
          </div>
          <Progress
            value={diskUsage.percentage}
            className="h-2"
            indicatorColor={diskUsage.color}
          />
        </div>

        {/* Usage Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Used</p>
            <p className="font-medium">{diskUsage.used}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Available</p>
            <p className="font-medium">{diskUsage.available}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-medium">{diskUsage.total}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium" style={{ color: diskUsage.color }}>
              {diskUsage.status === 'healthy' && '✅'}
              {diskUsage.status === 'warning' && '⚠️'}
              {diskUsage.status === 'critical' && '🚨'}
              {' '}
              {diskUsage.statusText}
            </p>
          </div>
        </div>

        {/* Warning Alert */}
        {diskUsage.status !== 'healthy' && (
          <Alert variant={diskUsage.status === 'critical' ? 'destructive' : 'default'}>
            <AlertDescription>
              {diskUsage.status === 'warning' &&
                'Disk usage is above 70%. Consider increasing disk size soon.'
              }
              {diskUsage.status === 'critical' &&
                'Disk usage is above 85%! Please increase disk size immediately.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Last Updated */}
        <p className="text-xs text-muted-foreground">
          Last checked: {new Date(diskUsage.checkedAt).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
```

---

### **Step 6: Add to Dashboard**

**File:** `frontend/src/pages/Dashboard.tsx`
```tsx
import { ServerHealthWidget } from '@/components/ServerHealthWidget';

export function Dashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Existing dashboard cards */}
      <BookingStatsCard />
      <RevenueCard />

      {/* NEW: Add Server Health Widget */}
      <ServerHealthWidget />

      {/* Rest of dashboard */}
    </div>
  );
}
```

---

## 🎨 **Visual Design Options:**

### **Option 1: Compact Card**
```tsx
<Card className="col-span-1">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <HardDrive className="h-5 w-5" />
      Disk Usage
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">{diskUsage.percentage}%</div>
    <Progress value={diskUsage.percentage} className="mt-2" />
    <p className="text-sm text-muted-foreground mt-2">
      {diskUsage.used} / {diskUsage.total} used
    </p>
  </CardContent>
</Card>
```

### **Option 2: Detailed Card** (Recommended)
```tsx
<Card className="col-span-2">
  <CardHeader>
    <CardTitle>Server Health Monitor</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      {/* Disk */}
      <div>
        <h3>💾 Disk</h3>
        <Progress value={disk.percentage} />
        <p>{disk.percentage}% used</p>
      </div>

      {/* Memory */}
      <div>
        <h3>🧠 Memory</h3>
        <Progress value={memory.percentage} />
        <p>{memory.percentage}% used</p>
      </div>

      {/* CPU Load */}
      <div>
        <h3>⚡ CPU Load</h3>
        <p>{cpu.loadAverage}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### **Option 3: Sidebar Widget**
```tsx
<aside className="w-64 border-l">
  <div className="p-4 space-y-4">
    <h2 className="font-semibold">Server Status</h2>

    <ServerHealthWidget />

    {/* Other sidebar widgets */}
  </div>
</aside>
```

---

## 📊 **Advanced Features (Optional):**

### **1. Historical Graph (7 days trend)**
```tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';

// Store daily readings in database
// Show trend graph
<LineChart data={last7Days}>
  <Line dataKey="percentage" stroke="#8884d8" />
  <XAxis dataKey="date" />
  <YAxis />
</LineChart>
```

### **2. Email Alert Integration**
```typescript
// In SystemService
if (percentage > 80 && !recentAlertSent) {
  await this.emailService.send({
    to: 'sharad.chaurasia@akshospitality.in',
    subject: '⚠️ Disk Space Alert',
    body: `Disk usage is ${percentage}%`,
  });
}
```

### **3. Multiple Servers View**
```tsx
<Card>
  <CardHeader>
    <CardTitle>All Servers</CardTitle>
  </CardHeader>
  <CardContent>
    <ServerStatus name="Hotel Neelkanth" ip="65.1.252.58" />
    <ServerStatus name="AKS Noida" ip="3.6.202.196" />
  </CardContent>
</Card>
```

---

## ✅ **Benefits of Dashboard Widget:**

### **vs Manual Check:**
```
Manual: SSH → Run command → Check number
Widget: Open dashboard → See instantly
```

### **vs Automated Script:**
```
Script: Check log file → Read text
Widget: Visual progress bar → Status at glance
```

### **vs Email Alert:**
```
Email: Only when problem (80%+)
Widget: Always visible, any time
```

---

## 🎯 **When to Use Dashboard Widget:**

### **Perfect For:**
✅ You check dashboard daily anyway
✅ Want visual/intuitive monitoring
✅ Multiple team members need visibility
✅ Professional presentation
✅ Real-time status needed

### **Not Needed If:**
❌ Rarely log into system
❌ Prefer command-line tools
❌ Weekly email check is enough
❌ Small team, only you manage

---

## 📱 **Mobile Responsive:**

```tsx
<Card className="w-full md:w-1/3 lg:w-1/4">
  {/* Adapts to screen size */}
  <div className="hidden md:block">
    {/* Detailed view on desktop */}
  </div>
  <div className="md:hidden">
    {/* Compact view on mobile */}
  </div>
</Card>
```

---

## 🚀 **Quick Implementation Steps:**

```bash
# 1. Create backend files (5 min)
cd backend/src
mkdir system
# Copy SystemModule, Service, Controller

# 2. Create frontend component (5 min)
cd frontend/src/components
# Copy ServerHealthWidget.tsx

# 3. Add to dashboard (2 min)
# Import and add <ServerHealthWidget />

# 4. Test (3 min)
npm run dev
# Open dashboard, see widget!

Total: 15 minutes
```

---

## 💰 **Cost:**

```
API calls: Free (same server)
Database: No extra storage needed
UI: Part of existing dashboard
CPU: Negligible (runs on server)

Total extra cost: ₹0!
```

---

## 🎯 **Final Look:**

```
Dashboard Layout:

┌──────────────────────────────────────────┐
│  Hotel Neelkanth CRM - Dashboard         │
├────────────┬────────────┬────────────────┤
│ Bookings   │ Revenue    │ Server Health  │
│ Today: 2   │ ₹15,000    │ ──────────────│
│ Pending: 1 │ Due: ₹5k   │ 💾 Disk: 31%  │
│            │            │ ████░░░░░░░░   │
│            │            │ ✅ Healthy     │
├────────────┴────────────┴────────────────┤
│ Recent Bookings...                       │
└──────────────────────────────────────────┘
```

---

**Want me to implement this for you?** 🚀

Takes 15 minutes, looks professional, very useful! 💯
