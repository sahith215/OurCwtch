import { createClient } from '@libsql/client/web'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

let rawUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'https://ourcwtch-db-sahith215.aws-ap-south-1.turso.io'
if (rawUrl.startsWith('libsql://')) {
  rawUrl = rawUrl.replace('libsql://', 'https://')
}
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcyOTE2NjMsImlkIjoiMDFhMDIyZTEtNjYwMS03NGVhLThlYzYtOGI0MzJlNmM2NTk0Iiwia2lkIjoidVB0eWtibld6UkVqNGlNUHdNUGRIcEtvc3NZVm4tOHRMSmx6YW90Wl9jQSIsInJpZCI6IjNjNjQ4ZmFmLTdhZWQtNDZjNC1iMGZlLTU0N2ViZTQxMTcyNCJ9.-OpLuiaNsTieWAtCPWAaeGAzYqBQWbvAdiGtg5k66NJ3kYnrbn8JYZnt_AkPrne_RoHFgExWfs-xeMy9g9jjAg'

const client = createClient({
  url: rawUrl,
  authToken,
})

export const db = drizzle(client, { schema })
