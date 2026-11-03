-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Family',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Parent',
    "familyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "familyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'windows',
    "label" TEXT NOT NULL DEFAULT 'Device',
    "policyVersion" INTEGER NOT NULL DEFAULT 1,
    "instantPaused" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "days" INTEGER[],
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "shieldLevel" TEXT NOT NULL DEFAULT 'full',
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppLimit" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "pkg" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "limitMins" INTEGER NOT NULL,

    CONSTRAINT "AppLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageDaily" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "pkg" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "mins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childId" TEXT,
    "severity" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "snippet" TEXT,
    "guidance" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracyM" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radiusM" INTEGER NOT NULL DEFAULT 200,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairingCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairingCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebFilter" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "blocklist" TEXT[] DEFAULT ARRAY['gamble-arcade.example', 'adult-example.test']::TEXT[],
    "whitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AppLimit_childId_pkg_key" ON "AppLimit"("childId", "pkg");

-- CreateIndex
CREATE UNIQUE INDEX "UsageDaily_childId_pkg_day_key" ON "UsageDaily"("childId", "pkg", "day");

-- CreateIndex
CREATE UNIQUE INDEX "PairingCode_code_key" ON "PairingCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WebFilter_familyId_key" ON "WebFilter"("familyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppLimit" ADD CONSTRAINT "AppLimit_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageDaily" ADD CONSTRAINT "UsageDaily_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Geofence" ADD CONSTRAINT "Geofence_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairingCode" ADD CONSTRAINT "PairingCode_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
