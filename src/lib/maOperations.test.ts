/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { buildDocumentRequests, changeOperationDocuments, maOperations } from './maOperations';
import { explicitDocumentSelection } from '../../supabase/functions/ensure-requests-for-process/documentSelection';

describe('PDF operation presets', () => {
  const expected = [
    ['due-diligence', 'Due Diligence Isolada', 12, 'Scope Letter (escopo)'],
    ['compra-quotas', 'Compra de Quotas', 11, 'Contrato de Compra e Venda de Quotas (QPA)'],
    ['investimento', 'Investimento', 13, 'Contrato de Investimento / Subscrição'],
    ['compra-acoes', 'Compra de Ações', 13, 'Share Purchase Agreement (SPA)'],
    ['joint-venture', 'Joint Venture', 11, 'Joint Venture Agreement (JVA)'],
    ['incorporacao', 'Incorporação', 10, 'Protocolo de Incorporação'],
    ['fusao', 'Fusão', 12, 'Protocolo de Fusão'],
    ['cisao', 'Cisão', 10, 'Protocolo de Cisão'],
  ] as const;
  for (const [id, name, count, instrument] of expected) {
    test(name, () => {
      const operation = maOperations.find(o => o.id === id);
      expect(operation?.name).toBe(name);
      expect(operation?.documents).toHaveLength(count);
      const selected = changeOperationDocuments([], 'manual', id);
      expect(selected).toContain(instrument);
      expect(selected).toEqual(operation?.documents.map(d => d.name));
    });
  }
  test('changing operation replaces preset documents and retains extra choices', () => {
    const initial = changeOperationDocuments(['Documento extra'], 'manual', 'due-diligence');
    const next = changeOperationDocuments(initial, 'due-diligence', 'compra-quotas');
    expect(next).toContain('Documento extra');
    expect(next).toContain('Contrato de Compra e Venda de Quotas (QPA)');
    expect(next).not.toContain('Scope Letter (escopo)');
    expect(changeOperationDocuments(next, 'compra-quotas', 'manual')).toEqual(['Documento extra']);
  });
  test('requests preserve deselection, custom metadata and tenant scope', () => {
    const requests = buildDocumentRequests(['NDA', 'Documento extra'], [{name:'Documento extra', hasIssueDate:true, hasExpirationDate:true, requiresIssuingLocation:true}], 'process-a', 'company-a');
    expect(requests.map(r => r.document_name)).toEqual(['NDA', 'Documento extra']);
    expect(requests.every(r => r.company_id === 'company-a' && r.process_id === 'process-a')).toBe(true);
    expect(requests[1]).toMatchObject({has_issue_date:true, has_expiration_date:true, requires_issuing_location:true});
    expect(requests[0].has_expiration_date).toBe(false);
  });
  test('explicit selections retain commas and do not infer an operation as a document', () => {
    expect(explicitDocumentSelection(['Instrumentos de averbação (RI, DETRAN, INPI)'])).toEqual(['Instrumentos de averbação (RI, DETRAN, INPI)']);
    expect(explicitDocumentSelection([])).toEqual([]);
    expect(explicitDocumentSelection(null)).toBeNull();
  });
});