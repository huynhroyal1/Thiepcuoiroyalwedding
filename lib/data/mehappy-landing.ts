/** Nội dung & asset URL landing Royal Wedding (một số ảnh CDN tham chiếu bản gốc). */

export const MEHAPPY_ASSET = "https://mehappy.vn";

export const showcaseTemplates = [
  {
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/admin/assets/dd4934bb-7099-4f13-bb51-9d343864cf0e-full.webp",
    title: "Giao diện Romantic - Gói VIP",
    desc: "Lãng mạn và vui vẻ là điều mà giao diện này có. Cảm giác nhẹ nhàng đơn giản nhưng vô cùng thích mắt. Tối ưu từng thiết kế 1 cách tỉ mỉ.",
    tags: ["Thiệp hiện đại", "Thiệp Sang Trọng"],
    tier: "vip" as const,
    hot: true,
  },
  {
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/5711/fc6cd66a-10fc-4248-a999-6e5ed5b5b3ae-full.webp",
    title: "Thiệp Mời NA01 - Gói VIP",
    desc: "Không gian Sang trọng tươi sáng, được thiết kế bài trí vô cùng tỉ mỉ và tinh tế. Tối ưu cho đa dạng thiết bị. Mang lại cảm giác dễ chịu.",
    tags: ["Thiệp Sang Trọng", "Thiệp hiện đại"],
    tier: "vip" as const,
    hot: false,
  },
  {
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/admin/assets/b8c8b665-08e7-4679-b947-717d1e37d855-full.webp",
    title: "Giao Diện NA02 - Gói VIP",
    desc: "Giao diện Luxury",
    tags: ["Thiệp Sang Trọng"],
    tier: "vip" as const,
    hot: false,
  },
  {
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/5711/983e9194-173c-4121-a997-3aafed5c2921-full.webp",
    title: "Giao diện NC11 - Gói VIP",
    desc: "Giao diện nổi bật với tone màu đỏ, sang trọng và lãng mạng. Mang lại cảm giác cuốn hút và thích thú.",
    tags: ["Tone Đỏ Trắng", "Thiệp đơn giản", "+2"],
    tier: "vip" as const,
    hot: false,
  },
  {
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/1927/77f8d2a8-393e-4ba5-b83d-aefc4a144652-full.webp",
    title: "Giao Diện Radiant - Gói Basic",
    desc: "Mẫu thiệp rạng rỡ với chủ đề tình yêu bất ngờ và hạnh phúc, giao diện tươi sáng và thông thoáng, cuốn hút mọi người xem.",
    tags: [] as string[],
    tier: "basic" as const,
    newHot: true,
  },
  {
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/1928/67d91017-be4f-46d2-95e3-95283716d77d-full.webp",
    title: "Giao diện HB02 - Gói Basic",
    desc: "Giao diện thiết kế tươi sáng mát mẻ, tạo cảm giác dễ chịu, vui vẻ cho người xem. Nơi lưu giữ kỷ niệm tuyệt vời cho dâu rể.",
    tags: [] as string[],
    tier: "basic" as const,
    newHot: true,
  },
  {
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/admin/assets/a5e7bace-8fc5-4319-8d41-c54f8232d361.webp",
    title: "Giao diện thiệp cưới DA05 - Gói Basic",
    desc: "Lãng mạn và vui vẻ là điều mà giao diện này có. Cảm giác nhẹ nhàng đơn giản nhưng vô cùng thích mắt. Tối ưu từng thiết kế 1 cách tỉ mỉ.",
    tags: ["Thiệp hiện đại", "Thiệp đơn giản"],
    tier: "basic" as const,
    newHot: false,
  },
  {
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/1929/9d282e53-c6c2-43ec-92e7-7d3c04ac30e3-full.webp",
    title: "Giao diện Pasiona - Gói Basic",
    desc: "Mộng mơ, say đắm là từ để diễn tả cho giao diện này. Tạo cảm giác nhẹ nhàng và dễ chịu cho người xem, các chi tiết được sắp xếp tỷ mỉ và tinh tế.",
    tags: [] as string[],
    tier: "basic" as const,
    newHot: true,
  },
];

export const featureBlocks = [
  {
    key: "info",
    image: `${MEHAPPY_ASSET}/wedding-info.png`,
    title: "Thông tin Đám cưới",
    bullets: [
      "Thông tin Cô Dâu & Chú Rể",
      "Địa điểm tổ chức hôn lễ, tiệc mừng",
      "Thời gian diễn ra sự kiện (Timeline...)",
      "Các sự kiện cưới (Tiệc cưới, lễ cưới,...)",
      "Bố mẹ 2 bên + Tứ gia 2 nhà",
    ],
  },
  {
    key: "share",
    image: `${MEHAPPY_ASSET}/wedding-share.png`,
    title: "Chia sẻ Cảm xúc",
    bullets: [
      "Chia sẻ Album ảnh cưới và Video.",
      "Câu chuyện tình yêu của Dâu Rể",
      "Hành trình yêu, các dấu mốc thời gian.",
      "Giới thiệu riêng cô Dâu chú Rể.",
      "Lời ngỏ, lời cảm ơn.",
    ],
  },
  {
    key: "feat",
    image: `${MEHAPPY_ASSET}/wedding-feature.png`,
    title: "Các tính năng Thiệp cưới",
    bullets: [
      "Gửi lời chúc mừng đám cưới + quản lý lời chúc.",
      "Xác nhận tham dự đám cưới.",
      "Quản lý danh sách khách mời tham dự.",
      "Mừng cưới online qua STK, mã QR Code.",
      "Đếm ngược thời gian tới sự kiện cưới.",
      "Google maps chỉ dẫn đến tân nơi cưới.",
      "Phát bài nhạc yêu thích và hiệu ứng thiệp.",
      "Ghi tên khách mời, hiển thị tự động tên khách mời hoặc mời đích danh khách.",
    ],
  },
  {
    key: "benefit",
    image: `${MEHAPPY_ASSET}/wedding-benefit.png`,
    title: "Quyền Lợi & Quà tặng",
    bullets: [
      "Trình thiết kế thiệp cưới chuyên nghiệp",
      "Quản lý kế hoạch cưới, ngân sách cưới",
      "Gói Basic, Pro, VIP linh hoạt",
      "Gửi mời online không giới hạn",
      "Đội ngũ hỗ trợ nhiệt tình tận tâm",
      "Chỉnh sửa thiệp không giới hạn",
      "Tùy chỉnh theo ý bạn dễ dàng",
    ],
  },
];

export const stepsBlock = {
  title: "4 Bước Để Sở Hữu Thiệp Cưới Điện Tử",
  image: `${MEHAPPY_ASSET}/step.png`,
  steps: [
    {
      n: 1,
      title: "Bước 1: Đăng ký/Đăng nhập",
      desc: "Đăng ký và chọn gói dịch vụ phù hợp để bắt đầu thiết kế thiệp cưới.",
    },
    {
      n: 2,
      title: "Bước 2: Chọn Mẫu Thiệp",
      desc: "Lựa chọn mẫu thiệp ưng ý từ kho giao diện đa dạng của chúng tôi.",
    },
    {
      n: 3,
      title: "Bước 3: Nhập Thông Tin",
      desc: "Điền thông tin đám cưới, tải ảnh và video lên thiệp.",
    },
    {
      n: 4,
      title: "Bước 4: Xuất Bản & Chia Sẻ",
      desc: "Hoàn tất và chia sẻ thiệp cưới đến bạn bè, người thân.",
    },
  ],
};

/** Thiệp mẫu cộng đồng — `invitationUrl` là trang thiệp bên ngoài, không route trong app này. */
export type CoupleShowcaseItem = {
  id: string;
  image: string;
  title: string;
  date: string;
  meta: string;
  invitationUrl: string;
};

export const couplesShowcase: CoupleShowcaseItem[] = [
  {
    id: "thuan-diu",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/17622/b30525d7-6488-4d83-95b0-e25a377a1f2c-seo.webp",
    title: "Đám cưới Thuận & Dịu",
    date: "15/05/2026",
    meta: "Mẫu: Giao diện Brightly - Gói Basic",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "tung-thuy",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/1929/df8ae6f8-0470-499f-9861-d283dd9a216a-seo.webp",
    title: "Thanh Tùng & Bùi Thủy",
    date: "15/05/2026",
    meta: "Mẫu: Giao diện Bustle - Gói Basic",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "quang-hien",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/5711/1ba5112e-30cb-427d-b3df-3c94eff34741-seo.webp",
    title: "Quang Trường & Thu Hiền",
    date: "15/05/2026",
    meta: "Mẫu: Giao diện Bustle - Gói PRO",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "tung-hien",
    image: "https://placehold.co/400x225/f43f5e/ffffff?text=Wedding",
    title: "Tùng Dương  & Lê Hiền",
    date: "15/05/2026",
    meta: "Mẫu: Giao diện Bustle - Gói PRO",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "doan-kieu",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/12440/a9642c68-020a-42cd-a118-d4b1e19acce4-seo.webp",
    title: "Thiệp cưới Phan Đoàn & Kiêu Diễn",
    date: "15/05/2026",
    meta: "Mẫu: Giao diện AT01 - Gói Basic",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "thang-trang",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/17616/96013fef-d808-4f8b-b6c8-f6631ab3e2dd-seo.webp",
    title: "Văn Thắng & Dương Trang",
    date: "15/05/2026",
    meta: "Mẫu: Giao diện Brightly - Gói PRO",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "minh-trinh",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/1927/f0eefd54-e309-41dd-b2ba-38b72f89f880-full.webp",
    title: "Minh Nhật Tú Trinh",
    date: "14/05/2026",
    meta: "Mẫu: Giao Diện Radiant - Gói Basic",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "quang-trinh",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/17605/291ca334-c7a7-4bfd-9c42-28e84dda75bb-seo.webp",
    title: "Đám cưới Đức Quảng & Mai Trinh",
    date: "14/05/2026",
    meta: "Mẫu: Giao diện HB02 - Gói Basic",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "tung-thuy-2",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/17598/111d8722-dafb-4dce-91a5-ef08e1ac08a4-seo.webp",
    title: "Thanh Tùng  & Thu Thủy ",
    date: "14/05/2026",
    meta: "Mẫu: Giao Diện Radiant - Gói Basic",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "long-gam",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/17588/3c9cafee-c906-4890-b896-80098f47a464-seo.webp",
    title: "Đám cưới Thành Long & Mỹ Gấm",
    date: "14/05/2026",
    meta: "Mẫu: Giao diện Flowers - Gói Basic",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "hoang-phuong",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/17562/1c7138bd-ce3c-4be0-94da-3d8bb97b30c0-seo.webp",
    title: "HUY HOÀNG & THANH PHƯƠNG",
    date: "14/05/2026",
    meta: "Mẫu: Giao Diện TD03 - Gói VIP",
    invitationUrl: "https://mehappy.vn",
  },
  {
    id: "hoang-nhi",
    image:
      "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/14968/60cac1f7-f385-48ec-bc4d-86e91daefd69-seo.webp",
    title: "Việt Hoàng & Yến Nhi Test",
    date: "14/05/2026",
    meta: "Mẫu: Giao diện Romany - Gói VIP",
    invitationUrl: "https://mehappy.vn",
  },
];

export const whyChooseItems = [
  {
    title: "Lưu giữ kỷ niệm",
    desc: "Lưu giữ album ảnh cưới, video và câu chuyện tình yêu mãi mãi.",
  },
  {
    title: "Chia sẻ dễ dàng",
    desc: "Chia sẻ thiệp cưới đến bạn bè qua mạng xã hội chỉ với 1 cú click.",
  },
  {
    title: "Tính năng hiện đại",
    desc: "Tích hợp bản đồ, mừng cưới online, xác nhận tham dự và nhiều tính năng khác.",
  },
  {
    title: "Đa dạng mẫu mã",
    desc: "Kho giao diện phong phú, cập nhật liên tục các xu hướng thiết kế mới nhất.",
  },
  {
    title: "Tiết kiệm chi phí",
    desc: "Không phát sinh chi phí in ấn — gửi thiệp online qua link và QR.",
  },
  {
    title: "Quản lý khách mời",
    desc: "Dễ dàng kiểm soát số lượng khách mời tham dự và lời chúc mừng.",
  },
];

export const faqMehappy = [
  {
    q: "Website đám cưới, thiệp cưới điện tử là gì ?",
    a: "Website đám cưới, thiệp cưới online là 1 trang web dành riêng cho đám cưới của các cặp đôi. Nơi dùng để lưu trữ những khoảnh khắc, kỷ niệm, hình ảnh cưới 1 cách mãi mãi. Là trang web dùng để mời cưới tới bạn bè và người thân thay cho những chiếc thiệp giấy cổ điển, là chiếc thiệp cưới thời 5.0 với rất nhiều tính năng và sự hữu ích. Giúp bạn mời cưới dễ dàng sành điệu, lưu trữ và chia sẽ câu chuyện tình yêu, album ảnh cưới đến mọi người. Cho phép mọi người gửi lời chúc, gửi tiền mừng cưới online, và có thể xác nhận tham dự,...giúp bạn quản lý kế hoạch cưới dễ dàng. Đám cưới của bạn sẽ trở nên đặc biệt hơn với mọi người.",
  },
  {
    q: "Tôi cần chuẩn bị những gì để bắt đầu có 1 chiếc thiệp cưới ?",
    a: "Bạn cần chuẩn bị Album ảnh cưới, Video nếu có để có thể chia sẻ đến mọi người. Một câu chuyện tình yêu đơn giản tự bạn viết. Các thông tin dâu rể và nội ngoại kèm ngày cưới cùng 1 vài thông tin cần thiết. Sau đấy thì tự tay tạo cho mình 1 chiếc thiệp cực xinh và ưng ý nhất thôi ^^!",
  },
  {
    q: "Ý nghĩa của Website thiệp cưới này là gì ?",
    a: "Website thiệp cưới hay thiệp cưới online chính là chiếc thiệp hồng trao tay 5.0 thay thế cho những chiếc thiệp giấy thông thường. Là nơi cung cấp đầy đủ các thông tin cưới cho khách mời của bạn, giúp bạn dễ dàng chia sẻ đến mọi người, dù ở xa hay gần 1 cách dễ dàng. Ngoài ra thiệp cưới online còn làm cho đám cưới của bạn trở nên rộn ràng hơn trước ngày cưới với những chia sẻ của bạn như: Album ảnh cưới, Video, gửi lời chúc cho vợ chồng bạn, câu chuyện tình yêu của bạn, hay thậm chí là đếm ngược thời gian để nhắc nhở khách mời, google maps chỉ dẫn tận nơi cho khách dự tiệc...Đám cưới của bạn sẽ rất tuyệt vời nhỉ !!",
  },
  {
    q: "Tôi có thể thay đổi thiết kế hoặc thông tin thiệp cưới sau khi nó đã hoàn thành và đã bàn giao không ?",
    a: "Dâu Rể hoàn toàn có thể thay đổi cho đến khi vừa ý kể các khi thiệp đã được bàn giao cho bạn, Royal Wedding luôn mong muốn bạn sẽ có 1 đám cưới thật tuyệt vời và hoàn mỹ nhất, nên đừng ngần ngại liên hệ với Royal Wedding để được hỗ trợ khi cần thiết nhé Dâu Rể. Đội ngũ sẽ luôn túc trực hỗ trợ Dâu Rể 24/7 mọi lúc mọi nơi!",
  },
  {
    q: "Tự thiết kế thiệp này có dễ không, tôi không rành về máy tính",
    a: "Hoàn toàn rất dễ để thiết kế. Bạn chỉ cần bấm vào sửa lại các thông tin đúng với của bạn. Không cần biết về thiết kế hay code web bạn cũng có thể dễ dàng hoàn thành thiệp này chỉ bằng vài thao tác chỉnh sửa. Bạn cũng có thể thực hiện việc đó trên điện thoại hoàn toàn đơn giản.",
  },
  {
    q: "Tôi có thể gửi thiệp cho bao nhiêu người ?",
    a: "Thiệp cưới điện tử sẽ không giới hạn số khách mời bạn muốn gửi, đây cũng là điều giúp bạn giảm được nhiều chi phí so với thiệp giấy phải in ấn.",
  },
];
