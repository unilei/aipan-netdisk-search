// 数据库连接配置优化
// 这个文件提供了优化的数据库连接配置建议

/**
 * 获取优化的数据库连接配置
 * @param {string} environment - 环境类型 ('development' | 'production' | 'test')
 * @returns {object} 数据库配置对象
 */
export function getDatabaseConfig(environment = 'production') {
  const baseConfig = {
    // 基础连接配置
    url: process.env.DATABASE_URL,
    
    // 连接池配置
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      }
    },
    
    // 查询优化
    log: environment === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    
    // 错误格式化
    errorFormat: environment === 'development' ? 'pretty' : 'minimal',
  }

  // 环境特定配置
  const environmentConfigs = {
    development: {
      // 开发环境：较小的连接池，更多日志
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?connection_limit=5&pool_timeout=20&connect_timeout=10'
        }
      }
    },
    
    production: {
      // 生产环境：优化的连接池配置
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=60&connect_timeout=30&statement_timeout=30000'
        }
      }
    },
    
    test: {
      // 测试环境：最小连接池
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?connection_limit=2&pool_timeout=10&connect_timeout=5'
        }
      }
    }
  }

  return {
    ...baseConfig,
    ...environmentConfigs[environment]
  }
}

/**
 * 数据库连接池参数说明：
 * 
 * connection_limit: 连接池最大连接数
 * - 开发环境: 5 (较少并发)
 * - 生产环境: 20 (根据服务器性能调整)
 * - 测试环境: 2 (最小化资源使用)
 * 
 * pool_timeout: 获取连接的超时时间(秒)
 * - 开发环境: 20秒
 * - 生产环境: 60秒
 * - 测试环境: 10秒
 * 
 * connect_timeout: 建立连接的超时时间(秒)
 * - 开发环境: 10秒
 * - 生产环境: 30秒
 * - 测试环境: 5秒
 * 
 * statement_timeout: SQL语句执行超时时间(毫秒)
 * - 生产环境: 30000ms (30秒)
 */

/**
 * 推荐的环境变量配置：
 * 
 * 开发环境 (.env.development):
 * DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=5&pool_timeout=20&connect_timeout=10"
 * 
 * 生产环境 (.env.production):
 * DATABASE_URL="postgresql://user:password@host:5432/dbname?connection_limit=20&pool_timeout=60&connect_timeout=30&statement_timeout=30000"
 * 
 * 测试环境 (.env.test):
 * DATABASE_URL="postgresql://user:password@localhost:5432/test_dbname?connection_limit=2&pool_timeout=10&connect_timeout=5"
 */

export default getDatabaseConfig