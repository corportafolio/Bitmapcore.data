import { Router, Request, Response } from 'express';
import { getBlocksDb } from '../database/db';

const router = Router();

function tableExists(db: any, tableName: string): boolean {
  try {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    return !!result;
  } catch {
    return false;
  }
}

// ===== TAGS =====
router.get('/', (req, res) => {
  try {
    const blocksDb = getBlocksDb();
    let tagList: any[] = [];
    if (tableExists(blocksDb, 'tag_tables')) {
      tagList = blocksDb.prepare('SELECT * FROM tag_tables ORDER BY lastUpdated DESC').all();
    }

    const specialTagCounts: Record<string, { count: number; distinctBlocks: number }> = {};

    try {
      const millonariasStats = getBlocksDb().prepare(`
        WITH RECURSIVE split_tags(bloque, etiqueta, rest) AS (
          SELECT 
            bloque,
            CASE 
              WHEN instr(etiquetas, '|') > 0 THEN trim(substr(etiquetas, 1, instr(etiquetas, '|') - 1))
              ELSE trim(etiquetas)
            END,
            CASE 
              WHEN instr(etiquetas, '|') > 0 THEN substr(etiquetas, instr(etiquetas, '|') + 1)
              ELSE ''
            END
          FROM blocks
          WHERE etiquetas LIKE '%millonaria%'
          
          UNION ALL
          
          SELECT 
            bloque,
            CASE 
              WHEN instr(rest, '|') > 0 THEN trim(substr(rest, 1, instr(rest, '|') - 1))
              ELSE trim(rest)
            END,
            CASE 
              WHEN instr(rest, '|') > 0 THEN substr(rest, instr(rest, '|') + 1)
              ELSE ''
            END
          FROM split_tags
          WHERE rest != ''
        )
        SELECT COUNT(*) as totalEtiquetas, COUNT(DISTINCT bloque) as totalBloquesUnicos
        FROM split_tags
        WHERE etiqueta LIKE '%millonaria%'
      `).get() as { totalEtiquetas: number; totalBloquesUnicos: number } | undefined;
      
      if (millonariasStats) {
        specialTagCounts['txS millonarias'] = {
          count: millonariasStats.totalEtiquetas,
          distinctBlocks: millonariasStats.totalBloquesUnicos
        };
      }
    } catch (e) { console.log('Error millonarias stats:', (e as Error).message); }

    try {
      const multimillonariasStats = getBlocksDb().prepare(`
        WITH RECURSIVE split_tags(bloque, etiqueta, rest) AS (
          SELECT 
            bloque,
            CASE 
              WHEN instr(etiquetas, '|') > 0 THEN trim(substr(etiquetas, 1, instr(etiquetas, '|') - 1))
              ELSE trim(etiquetas)
            END,
            CASE 
              WHEN instr(etiquetas, '|') > 0 THEN substr(etiquetas, instr(etiquetas, '|') + 1)
              ELSE ''
            END
          FROM blocks
          WHERE lower(etiquetas) LIKE '%multimillonaria%'
          
          UNION ALL
          
          SELECT 
            bloque,
            CASE 
              WHEN instr(rest, '|') > 0 THEN trim(substr(rest, 1, instr(rest, '|') - 1))
              ELSE trim(rest)
            END,
            CASE 
              WHEN instr(rest, '|') > 0 THEN substr(rest, instr(rest, '|') + 1)
              ELSE ''
            END
          FROM split_tags
          WHERE rest != ''
        )
        SELECT COUNT(*) as totalEtiquetas, COUNT(DISTINCT bloque) as totalBloquesUnicos
        FROM split_tags
        WHERE lower(etiqueta) LIKE '%multimillonaria%'
      `).get() as { totalEtiquetas: number; totalBloquesUnicos: number } | undefined;
      
      if (multimillonariasStats) {
        specialTagCounts['TXs MULTIMILLONARIAS'] = {
          count: multimillonariasStats.totalEtiquetas,
          distinctBlocks: multimillonariasStats.totalBloquesUnicos
        };
      }
    } catch (e) { console.log('Error multimillonarias stats:', (e as Error).message); }

    // Aplicar conteos corregidos a las tags
    if (tableExists(getBlocksDb(), 'tag_tables')) {
      tagList = getBlocksDb().prepare('SELECT * FROM tag_tables ORDER BY lastUpdated DESC').all();
    }

const correctedTags = tagList.map((tag: any) => {
      const corrected = specialTagCounts[tag.tagName];
      if (corrected) {
        return { ...tag, count: corrected.count, distinctBlocks: corrected.distinctBlocks };
      }
      return tag;
    });

    return res.json({ success: true, data: correctedTags });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ===== TAG PREVIEW (full block data for Mondrian) =====
router.get('/:tagName/preview', (req, res) => {
  try {
    const tagName = req.params.tagName;
    const bd1 = getBlocksDb();
    
    if (!tableExists(bd1, 'tagged_blocks') || !tableExists(bd1, 'tag_tables')) {
      return res.json({ success: true, data: null });
    }

    // Para etiquetas especiales, calcular conteos replicando lógica Android
    let stats: { totalEtiquetas: number; totalBloquesUnicos: number } | null = null;
    
    if (tagName === 'txS millonarias' || tagName === 'TXs MULTIMILLONARIAS') {
      const isMillonarias = tagName === 'txS millonarias';
      const whereClause = isMillonarias 
        ? "etiquetas LIKE '%millonaria%'"
        : "lower(etiquetas) LIKE '%multimillonaria%'";
      const filterClause = isMillonarias 
        ? "etiqueta LIKE '%millonaria%'"
        : "lower(etiqueta) LIKE '%multimillonaria%'";
      
      const statsResult = getBlocksDb().prepare(`
        WITH RECURSIVE split_tags(bloque, etiqueta, rest) AS (
          SELECT 
            bloque,
            CASE 
              WHEN instr(etiquetas, '|') > 0 THEN trim(substr(etiquetas, 1, instr(etiquetas, '|') - 1))
              ELSE trim(etiquetas)
            END,
            CASE 
              WHEN instr(etiquetas, '|') > 0 THEN substr(etiquetas, instr(etiquetas, '|') + 1)
              ELSE ''
            END
          FROM blocks
          WHERE ${tagName === 'txS millonarias' ? "etiquetas LIKE '%millonaria%'" : "lower(etiquetas) LIKE '%multimillonaria%'"}
          
          UNION ALL
          
          SELECT 
            bloque,
            CASE 
              WHEN instr(rest, '|') > 0 THEN trim(substr(rest, 1, instr(rest, '|') - 1))
              ELSE trim(rest)
            END,
            CASE 
              WHEN instr(rest, '|') > 0 THEN substr(rest, instr(rest, '|') + 1)
              ELSE ''
            END
          FROM split_tags
          WHERE rest != ''
        )
        SELECT COUNT(*) as totalEtiquetas, COUNT(DISTINCT bloque) as totalBloquesUnicos
        FROM split_tags
        WHERE ${tagName === 'txS millonarias' ? "etiqueta LIKE '%millonaria%'" : "lower(etiqueta) LIKE '%multimillonaria%'"}
      `).get() as { totalEtiquetas: number; totalBloquesUnicos: number } | undefined;
      
      if (statsResult) {
        stats = { totalEtiquetas: statsResult.totalEtiquetas, totalBloquesUnicos: statsResult.totalBloquesUnicos };
      }
    } else {
      // Etiquetas normales - usar tagged_blocks
      stats = getBlocksDb().prepare(`
        SELECT COUNT(*) as totalEtiquetas, COUNT(DISTINCT bloque) as totalBloquesUnicos
        FROM tagged_blocks WHERE tagName = ?
      `).get(tagName) as { totalEtiquetas: number; totalBloquesUnicos: number } | null;
    }

    // Obtener primer bloque etiquetado con datos completos desde tabla blocks
    let tagged: any = null;
    
    if (tagName === 'txS millonarias' || tagName === 'TXs MULTIMILLONARIAS') {
      const whereClause = tagName === 'txS millonarias' 
        ? "etiquetas LIKE '%millonaria%'"
        : "lower(etiquetas) LIKE '%multimillonaria%'";
      
      const firstBlock = getBlocksDb().prepare(`
        SELECT * FROM blocks 
        WHERE ${tagName === 'txS millonarias' ? "etiquetas LIKE '%millonaria%'" : "lower(etiquetas) LIKE '%multimillonaria%'"}
        ORDER BY bloque ASC LIMIT 1
      `).get() as { bloque: number; etiquetas: string; totalTransacciones: number } | undefined;
      
      if (firstBlock) {
        tagged = { bloque: firstBlock.bloque, etiquetas: firstBlock.etiquetas, totalTransacciones: firstBlock.totalTransacciones };
      }
    } else {
      tagged = getBlocksDb().prepare('SELECT * FROM tagged_blocks WHERE tagName = ? ORDER BY bloque ASC LIMIT 1').get(tagName);
    }

    if (!tagged) {
      return res.json({ success: true, data: null });
    }

    let block: any = null;
    if (tableExists(getBlocksDb(), 'blocks')) {
      block = getBlocksDb().prepare('SELECT * FROM blocks WHERE bloque = ?').get(tagged.bloque) as any;
    }

    const totalEtiquetas = stats ? stats.totalEtiquetas : 0;
    const totalBloquesUnicos = stats ? stats.totalBloquesUnicos : 0;

    if (block) {
      return res.json({ 
        success: true, 
        data: {
          bloque: block.bloque,
          totalTransacciones: block.totalTransacciones,
          totalBtc: block.totalBtc,
          hash: block.hash,
          etiquetas: tagged.etiquetas,
          totalEtiquetas,
          totalBloquesUnicos,
          tagName
        }
      });
    } else {
      return res.json({ 
        success: true, 
        data: {
          bloque: tagged.bloque,
          totalTransacciones: tagged.totalTransacciones,
          etiquetas: tagged.etiquetas,
          totalEtiquetas,
          totalBloquesUnicos,
          tagName
        }
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;