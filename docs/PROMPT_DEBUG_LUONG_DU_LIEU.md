# Prompt debug luồng dữ liệu Royal Wedding

Tài liệu này lưu các prompt mẫu để tái sử dụng khi cần debug những lỗi kiểu: submit ngoài trang public thành công nhưng dashboard không hiển thị dữ liệu đúng.

## 1. Prompt tổng quát: form public -> API -> DB -> dashboard

```text
Phân tích kỹ luồng dữ liệu từ form ngoài trang public -> API -> Supabase -> dashboard.

Yêu cầu:
1. Xác định chính xác dữ liệu đang được lưu vào bảng nào.
2. Kiểm tra dashboard đang đọc từ bảng nào.
3. So sánh xem có bị lệch nguồn dữ liệu không.
4. Nếu form submit thành công nhưng dashboard không hiện, hãy tìm nguyên nhân ở tầng mapping/query/filter thay vì chỉ nghi frontend.
5. Nếu cần, sửa để dashboard hợp nhất dữ liệu từ cả bảng nguồn chính và bảng phát sinh từ form public.
6. Sau khi sửa, lint lại đúng file đã chỉnh và tóm tắt rõ:
   - gốc lỗi
   - file đã sửa
   - vì sao sửa này giải quyết được vấn đề
```

## 2. Prompt chuyên debug RSVP

```text
Chưa thấy dữ liệu xác nhận tham dự lên dashboard, hãy phân tích kỹ toàn bộ luồng RSVP.

Hãy kiểm tra:
- form RSVP ở trang thiệp public đang gửi payload gì
- API RSVP đang insert vào bảng nào
- có update ngược về bảng guests hay không
- dashboard quản lý khách mời đang đọc từ guests hay từ rsvp
- nếu guests rỗng mà rsvp có dữ liệu thì vì sao dashboard vẫn không hiện

Mục tiêu:
- xác định đúng gốc lỗi
- sửa tối thiểu nhưng đúng bản chất
- đảm bảo phản hồi RSVP vẫn hiện ở dashboard kể cả khi chưa có guest record khớp
- lint lại file đã sửa
```

## 3. Prompt chuyên debug lời chúc

```text
Tôi gửi lời chúc từ thiệp public nhưng dữ liệu lên không đúng hoặc nút gửi báo thiếu thông tin.

Hãy debug theo thứ tự:
1. đọc component form lời chúc đang render thật trên trang
2. kiểm tra có nhiều form chồng nhau hoặc form giả trong template không
3. kiểm tra state input có thực sự bind vào nút submit đang bấm không
4. đọc API wishes
5. xác định dữ liệu được insert vào bảng nào
6. kiểm tra dashboard quản lý lời chúc đang đọc dữ liệu gì
7. sửa tận gốc và lint lại file đã chỉnh
```

## 4. Prompt chuyên debug mismatch giữa nơi ghi và nơi đọc

```text
Tôi submit ngoài trang public thành công nhưng dữ liệu không lên dashboard.

Hãy debug theo thứ tự:
1. đọc component form submit
2. đọc API route tương ứng
3. xác định bảng database được ghi
4. đọc page dashboard liên quan
5. xác định dashboard query/filter từ đâu
6. tìm mismatch giữa nơi ghi dữ liệu và nơi đọc dữ liệu
7. sửa triệt để theo đúng luồng dữ liệu
8. kiểm tra lint sau khi sửa
```

## 5. Prompt cực ngắn

```text
Phân tích end-to-end giúp tôi: form public -> API -> DB -> dashboard.
Tìm đúng chỗ lệch dữ liệu, sửa tận gốc, rồi lint lại file đã sửa.
```

## 6. Một dòng tăng độ chính xác

```text
Đừng đoán nhanh ở UI. Hãy xác minh bằng code xem dữ liệu đang ghi vào bảng nào và dashboard đang đọc từ bảng nào trước khi kết luận.
```

## 7. Gợi ý cách dùng

- Dùng mục 1 khi chưa rõ lỗi nằm ở đâu.
- Dùng mục 2 khi riêng phần xác nhận tham dự không đổ về quản lý khách mời.
- Dùng mục 3 khi form lời chúc báo sai validate hoặc submit không đúng ô người dùng nhập.
- Dùng mục 4 khi bạn biết chắc submit thành công nhưng dashboard không cập nhật.
- Dùng mục 5 khi cần prompt ngắn để thao tác nhanh.

## 8. Ghi chú từ case đã xử lý

Trong case thực tế vừa sửa:
- form RSVP có thể lưu vào bảng `rsvp`
- dashboard khách mời ban đầu chỉ đọc bảng `guests`
- vì vậy có tình huống submit thành công nhưng dashboard vẫn hiện 0
- hướng sửa đúng là kiểm tra cả nơi ghi và nơi đọc, rồi hợp nhất dữ liệu nếu cần
