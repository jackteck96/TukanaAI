import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabase"; // ajuste o caminho se necessário

const CadastroViaConvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [processData, setProcessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcessData = async () => {
      if (!token) {
        setError("Invalid or missing token.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("processos")
          .select("id, titulo, descricao, documentos(id, nome, status)")
          .eq("token_convite", token)
          .single();

        if (error || !data) {
          throw error || new Error("No data found for this token.");
        }

        setProcessData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProcessData();
  }, [token]);

  if (loading) return <p>Carregando dados...</p>;
  if (error) return <p>Erro: {error}</p>;
  if (!processData) return <p>Nenhum processo encontrado.</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{processData.titulo}</h1>
      <p className="mb-6 text-gray-600">{processData.descricao}</p>

      <h2 className="text-xl font-semibold mb-3">Documentos solicitados:</h2>
      <ul className="space-y-4">
        {processData.documentos.map((doc: any) => (
          <li key={doc.id} className="border p-4 rounded-lg">
            <p className="font-medium">{doc.nome}</p>
            <input
              type="file"
              className="mt-2"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                alert(`Arquivo ${file.name} anexado para ${doc.nome}`);
              }}
            />
          </li>
        ))}
      </ul>

      <button className="mt-8 bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={() => alert("Envio finalizado!")}>
        Finalizar envio
      </button>
    </div>
  );
};

export default CadastroViaConvite;
