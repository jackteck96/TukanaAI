import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CadastroViaConvite() {
  const [invite, setInvite] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
  });
  const [loading, setLoading] = useState(true);

  // 1️⃣ Buscar o convite pelo token da URL
  useEffect(() => {
    async function fetchInvite() {
      try {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) {
          alert("Token inválido.");
          return;
        }

        const { data, error } = await supabase
          .from("invites")
          .select("*, clients(*), document_requests(*)")
          .eq("token", token)
          .single();

        if (error || !data) {
          console.error(error);
          alert("Convite não encontrado.");
          return;
        }

        setInvite(data);
        setDocuments(data.document_requests || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, []);

  // 2️⃣ Atualizar campos do formulário
  function handleChange(e: any) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // 3️⃣ Upload de documentos
  async function handleFileUpload(requestId: string, file: File) {
    try {
      const filePath = `${invite.client_id}/${requestId}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      await supabase.from("document_uploads").insert({
        client_id: invite.client_id,
        document_request_id: requestId,
        file_path: filePath,
        uploaded_at: new Date(),
      });

      alert("Documento enviado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar o documento.");
    }
  }

  // 4️⃣ Submeter cadastro
  async function handleInviteSubmission() {
    try {
      if (!invite) return;

      const { error: updateError } = await supabase
        .from("clients")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          document: formData.document,
          updated_at: new Date(),
        })
        .eq("id", invite.client_id);

      if (updateError) {
        console.error(updateError);
        alert("Erro ao salvar cadastro.");
        return;
      }

      await supabase.from("invites").update({ status: "completed" }).eq("id", invite.id);

      alert("Cadastro finalizado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro inesperado. Tente novamente.");
    }
  }

  if (loading) return <p>Carregando...</p>;

  if (!invite) return <p className="text-center text-red-500 mt-10">Convite inválido ou expirado.</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Convite de Documentação — {invite.clients?.name || "Cliente"}
      </h1>

      <div className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Nome completo"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          className="w-full border rounded p-2"
          placeholder="E-mail"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Telefone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Documento (CPF/CNPJ)"
          name="document"
          value={formData.document}
          onChange={handleChange}
        />
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-3">Documentos Solicitados</h2>
      {documents.length === 0 ? (
        <p>Nenhum documento solicitado.</p>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li key={doc.id} className="border p-3 rounded flex justify-between items-center">
              <span>{doc.name}</span>
              <input type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload(doc.id, e.target.files[0])} />
            </li>
          ))}
        </ul>
      )}

      <button
        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        onClick={handleInviteSubmission}
      >
        Finalizar e Enviar
      </button>
    </div>
  );
}
