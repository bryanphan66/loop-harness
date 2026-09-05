# File của harness KHÔNG đi xuống dự án

> `harness-drift.sh` so cả cây `docs/` giữa harness và dự án. Nhưng một số file ở
> đây nói **về chính bộ harness**, không phải công cụ cho dự án dùng. Không khai
> ra thì dự án nào cũng báo thiếu chúng, mãi mãi, ở mọi lần chạy.
>
> Bốn dòng nhiễu cố định không giết được bản báo cáo, nhưng chúng dạy người đọc
> rằng bản báo cáo có nhiễu - và người đã học được điều đó sẽ bỏ qua cả dòng thứ
> năm, dòng thật. Đo trên một lượt chạy thật: bản báo cáo kêu 83 file, số thật là
> vài cái, và không ai đọc nó suốt nhiều tuần trong khi một bản vá 2.6 nằm im
> không được đẩy xuống.
>
> Khai ở đây = tuyên bố có chủ đích, đọc lại được, sửa lại được. Khác hẳn với việc
> nhét một danh sách bỏ qua vào trong script rồi không ai biết nó tồn tại.

| file | vì sao không đi xuống dự án |
|---|---|
| `docs/about/UNDERSTANDING-loop-harness.md` | mô tả repo harness cho người mới vào sửa harness - dự án không sửa harness |
| `docs/about/HARNESS_CHANGELOG.md` | nhật ký thay đổi của chính bộ harness; dự án theo dõi thay đổi của mình ở `STAGE.md` |
| `docs/process/macro-2-deltas.md` | sổ delta của harness - bằng chứng để sửa harness. Dự án ghi ma sát ở `docs/macro2-friction-log.md`, đó mới là đầu vào của sổ này |
| `docs/decisions/layer-nesting-harness-outermost.md` | quyết định kiến trúc của bộ harness, không phải quyết định của sản phẩm |

## Sửa danh sách này thế nào

Thêm một dòng khi tạo file mới chỉ dùng cho harness. Bỏ một dòng khi một file
nội bộ thành ra dự án cũng cần - lúc đó nó là file của kit, và phải đi xuống.

Nghi ngờ thì **đừng cho vào đây**: một file thừa ở dự án chỉ tốn chỗ, còn một
file thiếu mà bị khai là "cố tình thiếu" thì không ai đi tìm nữa.
