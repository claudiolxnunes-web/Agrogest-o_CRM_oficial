// ============================================================================
// ADMIN ROUTER
// ============================================================================

const adminRouter = router({
  getDatabaseStats: protectedProcedure.query(async ({ ctx }) => {
    // Qualquer usuario logado pode ver estatisticas
    return await getDatabaseStats();
  }),

  clearDatabase: protectedProcedure
    .input(z.object({ confirmationToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Qualquer usuario logado pode limpar (com confirmacao dupla)

      if (input.confirmationToken !== 'CONFIRM_CLEAR_ALL_DATA') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Token de confirmacao invalido',
        });
      }

      console.warn(`[CLEAR_DATABASE] Usuario ${ctx.user?.email} esta limpando a base de dados`);
      return await clearAllDatabaseData();
    }),
});
