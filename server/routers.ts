import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { emailRouter } from "./emailRouter";
import { clearAllDatabaseData, getDatabaseStats } from "./databaseCleaner";

// ============================================================================
// REPRESENTATIVES ROUTER
// ============================================================================

const representativesRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.getAllRepresentatives();
  }),

  getByRegion: protectedProcedure
    .input(z.object({ region: z.string() }))
    .query(async ({ input }) => {
      return await db.getRepresentativesByRegion(input.region);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getRepresentativeById(input.id);
    }),

  getByUserId: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getRepresentativeByUserId(input.userId);
    }),

  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      territory: z.string().optional(),
      region: z.string(),
      targetAnnualSales: z.number().optional(),
      hireDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return await db.createRepresentative(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      territory: z.string().optional(),
      region: z.string().optional(),
      performanceScore: z.number().optional(),
      totalSales: z.number().optional(),
      activeClients: z.number().optional(),
      targetAnnualSales: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { id, ...data } = input;
      return await db.updateRepresentative(id, data);
    }),
});

// ============================================================================
// CLIENTS ROUTER
// ============================================================================

const clientsRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.getAllClients();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getClientById(input.id);
    }),

  getByRepresentative: protectedProcedure
    .input(z.object({ representativeId: z.number() }))
    .query(async ({ input }) => {
      return await db.getClientsByRepresentative(input.representativeId);
    }),

  getByType: protectedProcedure
    .input(z.object({ type: z.enum(['farm', 'factory']) }))
    .query(async ({ input }) => {
      return await db.getClientsByType(input.type);
    }),

  getByRegion: protectedProcedure
    .input(z.object({ region: z.string() }))
    .query(async ({ input }) => {
      return await db.getClientsByRegion(input.region);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(['farm', 'factory']),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      region: z.string(),
      representativeId: z.number(),
      annualBudget: z.number().optional(),
      numberOfAnimals: z.number().optional(),
      contactPerson: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional' && ctx.user?.role !== 'representante') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return await db.createClient(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      region: z.string().optional(),
      annualBudget: z.number().optional(),
      businessPotentialScore: z.number().optional(),
      numberOfAnimals: z.number().optional(),
      contactPerson: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional' && ctx.user?.role !== 'representante') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { id, ...data } = input;
      return await db.updateClient(id, data);
    }),
});

// ============================================================================
// GOALS ROUTER
// ============================================================================

const goalsRouter = router({
  getByRepresentative: protectedProcedure
    .input(z.object({ representativeId: z.number() }))
    .query(async ({ input }) => {
      return await db.getGoalsByRepresentative(input.representativeId);
    }),

  getByPeriod: protectedProcedure
    .input(z.object({ representativeId: z.number(), period: z.string() }))
    .query(async ({ input }) => {
      return await db.getGoalByPeriod(input.representativeId, input.period);
    }),

  create: protectedProcedure
    .input(z.object({
      representativeId: z.number(),
      period: z.string(),
      targetAmount: z.number(),
      startDate: z.date(),
      endDate: z.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return await db.createGoal(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      currentAmount: z.number().optional(),
      status: z.enum(['not_started', 'in_progress', 'at_risk', 'completed', 'exceeded']).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { id, ...data } = input;
      return await db.updateGoal(id, data);
    }),
});

// ============================================================================
// OPPORTUNITIES ROUTER
// ============================================================================

const opportunitiesRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.getAllOpportunities();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getOpportunityById(input.id);
    }),

  getByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await db.getOpportunitiesByClient(input.clientId);
    }),

  getByRepresentative: protectedProcedure
    .input(z.object({ representativeId: z.number() }))
    .query(async ({ input }) => {
      return await db.getOpportunitiesByRepresentative(input.representativeId);
    }),

  getByStage: protectedProcedure
    .input(z.object({ stage: z.enum(['prospecting', 'qualified', 'proposal', 'negotiation', 'won', 'lost']) }))
    .query(async ({ input }) => {
      return await db.getOpportunitiesByStage(input.stage);
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      representativeId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      value: z.number(),
      probability: z.number().optional(),
      expectedCloseDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional' && ctx.user?.role !== 'representante') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return await db.createOpportunity(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      value: z.number().optional(),
      probability: z.number().optional(),
      stage: z.enum(['prospecting', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
      expectedCloseDate: z.date().optional(),
      actualCloseDate: z.date().optional(),
      lostReason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional' && ctx.user?.role !== 'representante') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { id, ...data } = input;
      return await db.updateOpportunity(id, data);
    }),
});

// ============================================================================
// ACTIVITIES ROUTER
// ============================================================================

const activitiesRouter = router({
  getByOpportunity: protectedProcedure
    .input(z.object({ opportunityId: z.number() }))
    .query(async ({ input }) => {
      return await db.getActivitiesByOpportunity(input.opportunityId);
    }),

  getByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await db.getActivitiesByClient(input.clientId);
    }),

  getByRepresentative: protectedProcedure
    .input(z.object({ representativeId: z.number() }))
    .query(async ({ input }) => {
      return await db.getActivitiesByRepresentative(input.representativeId);
    }),

  create: protectedProcedure
    .input(z.object({
      opportunityId: z.number().optional(),
      clientId: z.number(),
      representativeId: z.number(),
      type: z.enum(['visit', 'call', 'email', 'proposal', 'meeting', 'follow_up']),
      title: z.string(),
      description: z.string().optional(),
      activityDate: z.date(),
      result: z.string().optional(),
      nextAction: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional' && ctx.user?.role !== 'representante') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return await db.createActivity(input);
    }),
});

// ============================================================================
// ALERTS ROUTER
// ============================================================================

const alertsRouter = router({
  getByUser: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return await db.getAlertsByUser(ctx.user.id, input.unreadOnly);
    }),

  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      type: z.enum(['goal_at_risk', 'high_value_opportunity', 'milestone_reached', 'activity_reminder', 'system']),
      title: z.string(),
      message: z.string(),
      relatedEntityId: z.number().optional(),
      relatedEntityType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'gerente_regional') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return await db.createAlert(input);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.updateAlert(input.id, { isRead: true });
    }),
});
// ============================================================================
// AI ROUTER
// ============================================================================

const aiRouter = router({
  analyzeHistory: protectedProcedure
    .input(z.object({ representativeId: z.number() }))
    .mutation(async ({ input }) => {
      const { analyzeHistoryForInsights } = await import('./ai');
      return await analyzeHistoryForInsights(input.representativeId);
    }),
  predictClosure: protectedProcedure
    .input(z.object({ opportunityId: z.number() }))
    .mutation(async ({ input }) => {
      const { predictClosureProbability } = await import('./ai');
      return await predictClosureProbability(input.opportunityId);
    }),
  identifyPatterns: protectedProcedure
    .input(z.object({ region: z.string() }))
    .mutation(async ({ input }) => {
      const { identifySuccessPatterns } = await import('./ai');
      return await identifySuccessPatterns(input.region);
    }),
  getRecommendations: protectedProcedure
    .input(z.object({ representativeId: z.number() }))
    .mutation(async ({ input }) => {
      const { generatePersonalizedRecommendations } = await import('./ai');
      return await generatePersonalizedRecommendations(input.representativeId);
    }),
});

// ============================================================================
// ADMIN ROUTER
// ============================================================================

const adminRouter = router({
  getDatabaseStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return await getDatabaseStats();
  }),

  clearDatabase: protectedProcedure
    .input(z.object({ confirmationToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (input.confirmationToken !== 'CONFIRM_CLEAR_ALL_DATA') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Token de confirmacao invalido',
        });
      }

      console.warn(`[ADMIN] Usuario ${ctx.user?.email} esta limpando a base de dados`);
      return await clearAllDatabaseData();
    }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

  }),

  representatives: representativesRouter,
  clients: clientsRouter,
  goals: goalsRouter,
  opportunities: opportunitiesRouter,
  activities: activitiesRouter,
  alerts: alertsRouter,
  ai: aiRouter,
  email: emailRouter,
  admin: adminRouter,
  orders: ordersRouter,
  import: importRouter,
});

export type AppRouter = typeof appRouter;
