import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const youtubeId = (url: string) => {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m?.[1];
};
const vimeoId = (url: string) => url.match(/vimeo\.com\/(\d+)/)?.[1];

const ContentBody = ({ body }: { body: string }) => (
  <div className="content-prose">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href = "", children }) => {
          const yt = youtubeId(href);
          const vm = vimeoId(href);
          const src = yt ? `https://www.youtube-nocookie.com/embed/${yt}` : vm ? `https://player.vimeo.com/video/${vm}` : null;
          if (src) {
            return (
              <span className="block my-6 aspect-video w-full overflow-hidden rounded-lg border border-border">
                <iframe src={src} title="Vídeo" className="h-full w-full" allowFullScreen loading="lazy" />
              </span>
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" className="rounded-lg my-6" />,
      }}
    >
      {body}
    </ReactMarkdown>
  </div>
);

export default ContentBody;
