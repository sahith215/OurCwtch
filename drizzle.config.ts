export default {
  schema: './app/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:ourcwtch.db',
  },
}
