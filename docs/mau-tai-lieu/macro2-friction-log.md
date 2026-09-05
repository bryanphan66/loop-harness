# Sổ ma sát Macro 2

> Chép vào dự án thành `docs/macro2-friction-log.md` khi bắt đầu chạy Macro 2.
>
> **Việc của sổ này:** bắt tại chỗ mọi chỗ vướng trong lúc chạy, để cuối lượt có
> bằng chứng sửa Macro 2. Nhớ lại sau khi chạy xong thì mất gần hết - chỗ vướng
> là thứ vừa gỡ được là quên ngay.
>
> **Ghi ngay khi vướng, không gom cuối bước.** Một dòng 30 giây, không phải báo cáo.

## Ghi cái gì

Ghi khi gặp một trong sáu loại sau. Không thuộc sáu loại này thì không phải ma sát,
đừng ghi cho đầy sổ.

| loại | nghĩa là | ví dụ thật |
|---|---|---|
| `goal-mo-ho` | goal-text của bước không nói rõ phải làm gì, phải tự đoán | 2.4 không nhắc registry, agent tự code UI thay vì kéo từ thư viện |
| `gate-sai` | gate bắt nhầm (dương tính giả) hoặc bỏ lọt (âm tính giả) | quét import bắt luôn chuỗi nằm trong comment |
| `thieu-cong-cu` | phải làm tay vì không có script/playbook | đo 4 chỉ số bằng lệnh gõ tay, lần sau không lặp lại được |
| `lam-tay` | bước lẽ ra tự động nhưng phải người can thiệp | phải tự chạy lại server vì tiến trình cũ chưa chết |
| `lap-lai` | cùng một việc làm lại lần thứ 2 trở lên | sửa cùng một lỗi ở cả harness lẫn dự án vì quên re-propagate |
| `so-lech` | con số đo được không khớp thực tế | register 0% trong khi thật ra 60% - lệch tên file một ký tự |

## Sổ

Cột `sửa harness?` chỉ điền một trong: `chưa`, `đã sửa <commit>`, `mở MD-NN`, `không cần`.

| thời điểm | bước | loại | vướng ở đâu (file:line nếu có) | xử lý tại chỗ | sửa harness? |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Cuối lượt

1. Đếm theo cột `loại` - loại nào nhiều nhất là chỗ Macro 2 yếu nhất.
2. Mỗi dòng còn `chưa` ở cột cuối phải thành một delta `MD-NN` trong
   `loop-harness/docs/process/macro-2-deltas.md`, hoặc bị đóng kèm lý do.
3. Dòng `so-lech` đọc trước tiên: một phép đo sai làm hỏng mọi kết luận dựa vào nó.
