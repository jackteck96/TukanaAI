import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { maOperations } from '@/lib/maOperations';

interface Props { value: string; onChange: (value: string) => void; }

export function OperationSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label htmlFor="operation-type">Tipo de operação</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="operation-type"><SelectValue placeholder="Selecione o tipo de operação" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="manual">Outro / seleção livre</SelectItem>
          {maOperations.map(operation => <SelectItem key={operation.id} value={operation.id}>{operation.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}