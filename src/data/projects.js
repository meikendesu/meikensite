import wawawa from '../content/projects/wawawa.md?raw'

// 项目数据（列表页与详情页共用）
export const projects = [
  {
    id: 'wawawa',
    tag: 'Android 应用程序',
    name: 'Wawawa 摇晃发声程序',
    desc: '后台持续监听陀螺仪传感器数据，检测手表的摇晃动作并播放音效文件，多次摇晃可同时触发多次播放，根据摇动幅度动态调整音频播放速度',
    markdown: wawawa
  }
]

export function getProjectById(id) {
  return projects.find((p) => p.id === id)
}
