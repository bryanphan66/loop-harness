# Ngoại lệ của gate `dangling-refs` - repo harness

> Đây là repo harness, không phải một dự án. Bảng quy trình ở đây nhắc tới những
> artifact mà **chỉ dự án mới sinh ra**, nên chúng treo ở đây là đúng, không phải lỗi.
>
> Luật khai và ba nhóm lý do: xem `../mau-tai-lieu/dangling-refs-allow.md`.

| tham chiếu | lý do chấp nhận |
|---|---|
| `docs/build-manifest.md` | dự án sinh ở bước 2.3 - harness chỉ có mẫu ở `mau-tai-lieu/` |
| `docs/ROADMAP.md` | dự án sinh ở bước 2.3 (khung ra đời từ mẫu) |
| `config/deploy.yml` | nằm trong bộ khung `scaffolds/stack-pnpm-nest-next/`, không ở gốc repo |
| `.harness/steady-state/scripts/new-issue.mjs` | đường dẫn TRONG DỰ ÁN; ở repo harness file nằm tại `scaffolds/steady-state/scripts/` - installer nhúng nó thành `.harness/steady-state/` |
| `.harness/steady-state/scripts/issue-state.mjs` | như trên - cùng kit, cùng lý do |
