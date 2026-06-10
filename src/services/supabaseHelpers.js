import { supabase } from './supabaseClient'

const PAGE_SIZE = 1000

/** Lee todas las filas de una tabla paginando (PostgREST limita a 1000 filas por defecto). */
export async function selectAll(table, { columns = '*', orderBy = 'id', ascending = true } = {}) {
    const rows = []
    let from = 0
    for (;;) {
        const { data, error } = await supabase
            .from(table)
            .select(columns)
            .order(orderBy, { ascending })
            .range(from, from + PAGE_SIZE - 1)
        if (error) throw error
        rows.push(...data)
        if (data.length < PAGE_SIZE) break
        from += PAGE_SIZE
    }
    return rows
}

/** Inserta filas en lotes para evitar límites de tamaño de petición. */
export async function insertInBatches(table, rows, batchSize = 500) {
    for (let i = 0; i < rows.length; i += batchSize) {
        const { error } = await supabase.from(table).insert(rows.slice(i, i + batchSize))
        if (error) throw error
    }
}

/** Borra todas las filas de una tabla (id BIGSERIAL siempre >= 0). */
export async function deleteAll(table) {
    const { error } = await supabase.from(table).delete().gte('id', 0)
    if (error) throw error
}
