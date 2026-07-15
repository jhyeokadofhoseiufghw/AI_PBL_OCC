"use client";

import { useEffect, useRef, useState } from "react";

import { createFeedPost, updateFeedPost } from "../actions";
import { PromotionGenerator } from "@/features/promotion/components/promotion-generator";

type EventInput = {
  eventId: string;
  title: string;
  genre: string;
  description: string;
  schedule: string;
  venue: string;
};

type ExistingFeed = { id: string; imageUrl: string; content: string } | null;

export function UnifiedFeedManager({
  event,
  existing,
}: {
  event: EventInput;
  existing: ExistingFeed;
}) {
  const [content, setContent] = useState(existing?.content ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(existing?.imageUrl ?? "");
  const [imageError, setImageError] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function selectFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("이미지 파일만 사용할 수 있습니다.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError("이미지는 4MB 이하여야 합니다.");
      return;
    }
    setImageError(undefined);
    setFileName(file.name || "붙여넣은 이미지");
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="mt-6 space-y-8">
      <section>
        <p className="ha-kicker">Home feed editor</p>
        <h2 className="ha-title mt-1 text-2xl">
          {existing ? "홈 피드 수정" : "홈 피드 만들기"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          공연당 하나의 홍보 피드만 홈 화면에 노출됩니다. 직접 작성하거나 아래의
          AI 문구 생성 기능을 사용할 수 있습니다.
        </p>
        <form
          action={existing ? updateFeedPost : createFeedPost}
          className="mt-5 grid items-start gap-6 lg:grid-cols-2"
          onPaste={(event) => {
            const file = [...event.clipboardData.items]
              .find((item) => item.type.startsWith("image/"))
              ?.getAsFile();
            if (!file || !fileRef.current) return;
            event.preventDefault();
            const transfer = new DataTransfer();
            transfer.items.add(file);
            fileRef.current.files = transfer.files;
            selectFile(file);
          }}
        >
          <input name="eventId" type="hidden" value={event.eventId} />
          {existing ? <input name="postId" type="hidden" value={existing.id} /> : null}
          <div className="ha-card space-y-5 p-5 sm:p-7">
            <label className="block text-sm font-medium">
              이미지 URL
              <input
                className="ha-input mt-2"
                name="imageUrl"
                onChange={(event) => {
                  setImageUrl(event.target.value);
                  setPreviewUrl(event.target.value.trim());
                }}
                placeholder="https://..."
                type="url"
                value={imageUrl}
              />
            </label>
            <div>
              <span className="text-sm font-medium">이미지 파일 또는 붙여넣기</span>
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-[#ccc3d6] bg-white p-1.5">
                <label
                  className="shrink-0 cursor-pointer rounded-lg bg-[#420093] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#712ae2]"
                  htmlFor="feed-image"
                >
                  파일 선택
                </label>
                <span className="min-w-0 truncate text-sm text-zinc-500">
                  {fileName ?? "선택된 파일 없음"}
                </span>
                <input
                  accept="image/*"
                  className="sr-only"
                  id="feed-image"
                  name="image"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                  ref={fileRef}
                  type="file"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                파일을 선택하거나 이 영역에 클립보드 이미지를 붙여넣으세요. 최대 4MB
              </p>
              {imageError ? <p className="mt-2 text-sm text-red-700" role="alert">{imageError}</p> : null}
            </div>
            <label className="block text-sm font-medium">
              피드 본문
              <textarea
                className="ha-input mt-2"
                maxLength={3000}
                name="content"
                onChange={(event) => setContent(event.target.value)}
                required
                rows={6}
                value={content}
              />
            </label>
            <button className="ha-button-primary w-full px-5 py-3" type="submit">
              {existing ? "피드 변경사항 저장" : "홈 피드 게시"}
            </button>
          </div>

          <aside className="ha-card overflow-hidden p-4 sm:p-5">
            <p className="ha-kicker">Live preview</p>
            <h3 className="ha-title mt-1 text-lg">홈 피드 미리보기</h3>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <div className="aspect-[4/3] bg-[#eff3ff]">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="피드 이미지 미리보기" className="h-full w-full object-cover" src={previewUrl} />
                ) : (
                  <div className="grid h-full place-items-center px-6 text-center text-sm text-zinc-400">
                    이미지를 선택하거나 붙여넣으면 여기에 표시됩니다.
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-bold text-[#712ae2]">{event.genre}</p>
                <h4 className="ha-title mt-1 text-xl">{event.title}</h4>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                  {content || "작성한 피드 문구가 여기에 표시됩니다."}
                </p>
              </div>
            </div>
          </aside>
        </form>
      </section>

      <section className="border-t border-[#dfe3ec] pt-8">
        <div>
          <p className="ha-kicker">AI writing assistant</p>
          <h2 className="ha-title mt-1 text-2xl">AI로 피드 문구 만들기</h2>
          <p className="mt-2 text-sm text-zinc-500">
            톤별 문구 중 하나를 골라 위 피드 본문에 바로 적용할 수 있습니다.
          </p>
        </div>
        <PromotionGenerator initial={event} onUse={setContent} />
      </section>
    </div>
  );
}
