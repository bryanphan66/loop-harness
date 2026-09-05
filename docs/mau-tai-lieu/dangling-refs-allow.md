# Ngoại lệ của gate `dangling-refs`

> Chép vào dự án thành `docs/gates/dangling-refs-allow.md` ở bước 2.0.
>
> Mỗi dòng là **một** tham chiếu treo đã được chấp nhận, **kèm lý do và nguồn**.
> Gate xanh khi mọi tham chiếu treo đều có mặt ở đây; còn một cái chưa khai thì đỏ.
>
> **Vì sao có file này:** gate từng đỏ vĩnh viễn vì có những tham chiếu treo hợp lệ.
> Agent viết văn giải thích rồi đi tiếp. Lần sau có một tham chiếu treo MỚI thì nó là
> dòng thứ N+1 trong một danh sách đỏ sẵn N dòng, không ai nhận ra. **Gate đỏ mãi là
> gate mù.**
>
> Ba nhóm lý do được chấp nhận. Ngoài ba nhóm này thì **sửa**, đừng khai:
> 1. Engine/artifact của macro khác - ngoài phạm vi macro đang chạy.
> 2. Output của bước sau chưa sinh - ghi rõ bước nào sinh ra nó.
> 3. Thứ đã có quyết định N/A ghi trước đó - **trích số hiệu quyết định** làm nguồn.
>
> Ngoại lệ hết treo mà vẫn nằm đây thì gate báo **thừa** - xoá đi, đừng để phình.

| tham chiếu | lý do chấp nhận |
|---|---|
| `docs/vi-du.md` | *(xoá dòng mẫu này)* output của bước 2.x, chưa sinh |
