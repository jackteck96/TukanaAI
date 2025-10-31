import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConvertRequest {
  file: string; // base64 encoded file
  fileName: string;
  fileType: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file, fileName, fileType }: ConvertRequest = await req.json();
    
    console.log('Converting file:', fileName, 'Type:', fileType);

    // Decode base64 file
    const fileBuffer = Uint8Array.from(atob(file), c => c.charCodeAt(0));
    
    let pdfBase64: string;
    let conversionNote = '';

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      // DOCX conversion
      conversionNote = 'Conversão concluída — o PDF pode ter pequenas diferenças visuais em relação ao documento original.';
      
      try {
        // Import mammoth dynamically
        const mammoth = await import('https://esm.sh/mammoth@1.6.0');
        
        // Convert DOCX to HTML
        const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer.buffer });
        const html = result.value;
        
        // Use jsPDF to convert HTML to PDF
        const jsPDF = (await import('https://esm.sh/jspdf@2.5.1')).default;
        const doc = new jsPDF();
        
        // Simple HTML to PDF conversion
        // Split content into lines and add to PDF
        const tempDiv = html.replace(/<[^>]*>/g, '\n'); // Remove HTML tags
        const lines = tempDiv.split('\n').filter(line => line.trim());
        
        let yPosition = 20;
        const pageHeight = doc.internal.pageSize.height;
        
        lines.forEach((line) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          const wrappedLines = doc.splitTextToSize(line, 170);
          doc.text(wrappedLines, 20, yPosition);
          yPosition += wrappedLines.length * 7;
        });
        
        pdfBase64 = doc.output('datauristring').split(',')[1];
      } catch (error) {
        console.error('Error converting DOCX:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao converter documento Word. Tente com outro formato.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (fileType.startsWith('image/') || ['.jpg', '.jpeg', '.png'].some(ext => fileName.toLowerCase().endsWith(ext))) {
      // Image conversion
      conversionNote = 'Conversão concluída com sucesso.';
      
      try {
        const jsPDF = (await import('https://esm.sh/jspdf@2.5.1')).default;
        const doc = new jsPDF();
        
        // Convert buffer to base64 data URL
        const base64Image = `data:${fileType};base64,${file}`;
        
        // Add image to PDF
        const imgProps = doc.getImageProperties(base64Image);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(base64Image, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdfBase64 = doc.output('datauristring').split(',')[1];
      } catch (error) {
        console.error('Error converting image:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao converter imagem. Tente com outro formato.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      // Text file conversion
      conversionNote = 'Conversão concluída com sucesso.';
      
      try {
        const jsPDF = (await import('https://esm.sh/jspdf@2.5.1')).default;
        const doc = new jsPDF();
        
        const textContent = new TextDecoder().decode(fileBuffer);
        const lines = textContent.split('\n');
        
        let yPosition = 20;
        const pageHeight = doc.internal.pageSize.height;
        
        lines.forEach((line) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          const wrappedLines = doc.splitTextToSize(line, 170);
          doc.text(wrappedLines, 20, yPosition);
          yPosition += wrappedLines.length * 7;
        });
        
        pdfBase64 = doc.output('datauristring').split(',')[1];
      } catch (error) {
        console.error('Error converting text:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao converter arquivo de texto.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('Unsupported file type:', fileType);
      return new Response(
        JSON.stringify({ 
          error: 'Formato não suportado para conversão no momento.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const outputFileName = fileName.replace(/\.[^/.]+$/, '') + ' (PDF).pdf';

    return new Response(
      JSON.stringify({ 
        pdfBase64,
        fileName: outputFileName,
        conversionNote
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in documentConverter:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao processar conversão.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
