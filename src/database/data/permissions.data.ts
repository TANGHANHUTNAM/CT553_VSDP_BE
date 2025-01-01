const VERSION = '/api/v1';

export const MODULES = {
  AUTH: 'AUTH',
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
};

export const METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export const PERMISSION_DATA = [
  // AUTH
  {
    name: 'Đăng nhập',
    api_path: VERSION + '/auth/login',
    method: METHOD.POST,
    module: MODULES.AUTH,
  },
  {
    name: 'Đăng xuất',
    api_path: VERSION + '/auth/logout',
    method: METHOD.POST,
    module: MODULES.AUTH,
  },
  {
    name: 'Lấy thông tin tài khoản người dùng',
    api_path: VERSION + '/auth/account',
    method: METHOD.GET,
    module: MODULES.AUTH,
  },
  {
    name: 'Lấy refresh token',
    api_path: VERSION + '/auth/refresh_token',
    method: METHOD.GET,
    module: MODULES.AUTH,
  },
  // USER
  {
    name: 'Lấy danh sách người dùng có phân trang',
    api_path: VERSION + '/users',
    method: METHOD.GET,
    module: MODULES.USER,
  },
  {
    name: 'Lấy thông tin người dùng theo id',
    api_path: VERSION + '/users/:id',
    method: METHOD.GET,
    module: MODULES.USER,
  },
  {
    name: 'Tạo mới người dùng',
    api_path: VERSION + '/users',
    method: METHOD.POST,
    module: MODULES.USER,
  },
  {
    name: 'Cập nhật thông tin người dùng',
    api_path: VERSION + '/users/:id',
    method: METHOD.PATCH,
    module: MODULES.USER,
  },
  {
    name: 'Xóa người dùng',
    api_path: VERSION + '/users/:id',
    method: METHOD.DELETE,
    module: MODULES.USER,
  },
  // ROLE
  {
    name: 'Lấy danh sách role có phân trang',
    api_path: VERSION + '/roles',
    method: METHOD.GET,
    module: MODULES.ROLE,
  },
  {
    name: 'Lấy thông tin role theo id',
    api_path: VERSION + '/roles/:id',
    method: METHOD.GET,
    module: MODULES.ROLE,
  },
  {
    name: 'Tạo mới role',
    api_path: VERSION + '/roles',
    method: METHOD.POST,
    module: MODULES.ROLE,
  },
  {
    name: 'Cập nhật thông tin role',
    api_path: VERSION + '/roles/:id',
    method: METHOD.PATCH,
    module: MODULES.ROLE,
  },
  {
    name: 'Xóa role',
    api_path: VERSION + '/roles/:id',
    method: METHOD.DELETE,
    module: MODULES.ROLE,
  },
  {
    name: 'Cập nhật trạng thái role',
    api_path: VERSION + '/roles/status/:id',
    method: METHOD.PATCH,
    module: MODULES.ROLE,
  },
  // PERMISSION
  {
    name: 'Lấy danh sách permission có phân trang',
    api_path: VERSION + '/permissions',
    method: METHOD.GET,
    module: MODULES.PERMISSION,
  },
  {
    name: 'Lấy thông tin permission theo id',
    api_path: VERSION + '/permissions/:id',
    method: METHOD.GET,
    module: MODULES.PERMISSION,
  },
  {
    name: 'Tạo mới permission',
    api_path: VERSION + '/permissions',
    method: METHOD.POST,
    module: MODULES.PERMISSION,
  },
  {
    name: 'Cập nhật thông tin permission',
    api_path: VERSION + '/permissions/:id',
    method: METHOD.PATCH,
    module: MODULES.PERMISSION,
  },
  {
    name: 'Xóa permission',
    api_path: VERSION + '/permissions/:id',
    method: METHOD.DELETE,
    module: MODULES.PERMISSION,
  },
];
