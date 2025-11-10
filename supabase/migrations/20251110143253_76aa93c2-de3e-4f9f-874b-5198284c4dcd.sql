-- Backfill company_id for legacy processes so collaborators with FULL access can see all

-- 1) Fill from creator profile company
UPDATE public.processes p
SET company_id = prof.company_id,
    updated_at = now()
FROM public.profiles prof
WHERE p.company_id IS NULL
  AND p.created_by = prof.id
  AND prof.company_id IS NOT NULL;

-- 2) Fill from documents linked to the process when available
WITH doc_companies AS (
  SELECT d.process_id, 
         -- If multiple companies exist, pick the most frequent one
         (SELECT company_id FROM (
            SELECT company_id, COUNT(*) AS c
            FROM public.documents d2
            WHERE d2.process_id = d.process_id AND d2.company_id IS NOT NULL
            GROUP BY company_id
            ORDER BY c DESC
            LIMIT 1
         ) x) AS company_id
  FROM public.documents d
  WHERE d.company_id IS NOT NULL
  GROUP BY d.process_id
)
UPDATE public.processes p
SET company_id = dc.company_id,
    updated_at = now()
FROM doc_companies dc
WHERE p.company_id IS NULL
  AND p.id = dc.process_id
  AND dc.company_id IS NOT NULL;

-- 3) Optional sanity: ensure future inserts/updates refresh updated_at
-- (Already handled by triggers in project for some tables; leaving unchanged here)

-- 4) Verify (no-op select to count remaining nulls)
-- SELECT COUNT(*) FROM public.processes WHERE company_id IS NULL;