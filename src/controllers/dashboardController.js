import prisma from "../../prisma/client";


export const getDashboardStats = async (req, res) => {
  try {
    // TOTAL STATS
    const totalLeads = await prisma.lead.count();
    const totalUsers = await prisma.user.count();
    const totalActivities = await prisma.activity.count();

    // LEADS PER MONTH (FOR LINE CHART)
    const leadsByMonth = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(createdAt, 'YYYY-MM') AS month,
        COUNT(*) AS total
      FROM "Lead"
      GROUP BY month
      ORDER BY month ASC;
    `;

    // ACTIVITIES BY TYPE (FOR PIE CHART)
    const activitiesByType = await prisma.activity.groupBy({
      by: ["type"],
      _count: { type: true }
    });

    // LEAD STATUS COUNT (FOR BAR CHART)
    const leadStatus = await prisma.lead.groupBy({
      by: ["status"],
      _count: { status: true }
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard analytics fetched",
      data: {
        totals: {
          leads: totalLeads,
          users: totalUsers,
          activities: totalActivities
        },
        charts: {
          leadsByMonth,
          activitiesByType,
          leadStatus
        }
      }
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard analytics",
      error: error.message
    });
  }
};
