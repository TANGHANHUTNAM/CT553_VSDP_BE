const VERSION = '/api/v1';

export const MODULES = {
  AUTH: 'AUTH',
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  FORM: 'FORM',
};

export const METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export const PERMISSION_DATA = [
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
    name: 'Thêm danh sách người dùng',
    api_path: VERSION + '/users/batch',
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
  {
    name: 'Cập nhật trạng thái người dùng',
    api_path: VERSION + '/users/status/:id',
    method: METHOD.PATCH,
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
    name: 'Lấy tất cả role',
    api_path: VERSION + '/roles/all',
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
  {
    name: 'Cập nhật quyền hạn role',
    api_path: VERSION + '/roles/permission/:id',
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
  {
    name: 'Lấy tất cả permission',
    api_path: VERSION + '/permissions/all',
    method: METHOD.GET,
    module: MODULES.PERMISSION,
  },
  {
    name: 'Lấy tất cả quyền hạn của vai trò',
    api_path: VERSION + '/permissions/role/:id',
    method: METHOD.GET,
    module: MODULES.PERMISSION,
  },
  // FORM
  {
    name: 'Lấy danh sách biểu mẫu có phân trang',
    api_path: VERSION + '/forms',
    method: METHOD.GET,
    module: MODULES.FORM,
  },
  {
    name: 'Lấy thông tin biểu mẫu',
    api_path: VERSION + '/forms/:id',
    method: METHOD.GET,
    module: MODULES.FORM,
  },
  {
    name: 'Tạo mới biểu mẫu',
    api_path: VERSION + '/forms',
    method: METHOD.POST,
    module: MODULES.FORM,
  },
  {
    name: 'Cập nhật thông tin biểu mẫu',
    api_path: VERSION + '/forms/:id',
    method: METHOD.PATCH,
    module: MODULES.FORM,
  },
  // UNIVERSITY
  {
    name: 'Lấy danh sách trường học có phân trang',
    api_path: VERSION + '/universities',
    method: METHOD.GET,
    module: 'UNIVERSITY',
  },
  {
    name: 'Lấy tất cả trường học',
    api_path: VERSION + '/universities/all',
    method: METHOD.GET,
    module: 'UNIVERSITY',
  },
  {
    name: 'Tạo mới trường học',
    api_path: VERSION + '/universities',
    method: METHOD.POST,
    module: 'UNIVERSITY',
  },
  {
    name: 'Cập nhật thông tin trường học',
    api_path: VERSION + '/universities/:id',
    method: METHOD.PATCH,
    module: 'UNIVERSITY',
  },
];
