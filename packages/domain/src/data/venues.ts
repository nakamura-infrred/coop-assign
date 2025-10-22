import type { Venue } from '../types.js'

const createVenue = (
  id: string,
  name: string,
  type: Venue['type'],
  region: Venue['region'],
  address?: string,
  note?: string,
): Venue => ({
  id,
  name,
  type,
  region,
  address,
  note,
})

export const tokaiUniversityVenues: Venue[] = [
  createVenue('aichi-gakuin-ground', '愛知学院大学G', 'university', 'tokai'),
  createVenue('aichi-education-ground', '愛知教育大学G', 'university', 'tokai'),
  createVenue('aichi-tech-ground', '愛知工業大学G', 'university', 'tokai'),
  createVenue('aichi-sangyo-ground', '愛知産業大学G', 'university', 'tokai'),
  createVenue('aichi-shukutoku-ground', '愛知淑徳大学G', 'university', 'tokai'),
  createVenue('aichi-university-ground', '愛知大学G', 'university', 'tokai'),
  createVenue('aichi-toho-ground', '愛知東邦大学G', 'university', 'tokai'),
  createVenue('shigakkan-ground', '至学館大学G', 'university', 'tokai'),
  createVenue('seijyo-ground', '星城大学G', 'university', 'tokai'),
  createVenue('daido-motohama-ground', '大同大学元浜G', 'university', 'tokai'),
  createVenue('chukyo-ground', '中京大学G', 'university', 'tokai'),
  createVenue('chubu-ground', '中部大学G', 'university', 'tokai'),
  createVenue('tokai-gakuen-ground', '東海学園大学G', 'university', 'tokai'),
  createVenue('doho-ground', '同朋大学G', 'university', 'tokai'),
  createVenue('nanzan-ground', '南山大学G', 'university', 'tokai'),
  createVenue('nihon-fukushi-ground', '日本福祉大学G', 'university', 'tokai'),
  createVenue('toyohashi-tech-ground', '豊橋技術科学大学G', 'university', 'tokai'),
  createVenue('chubu-gakuin-ground', '中部学院大学G', 'university', 'tokai'),
  createVenue('nagoya-foreign-studies-ground', '名古屋外国語大学G', 'university', 'tokai'),
  createVenue('nagoya-gakuin-ground', '名古屋学院大学G', 'university', 'tokai'),
  createVenue('nagoya-keizai-ground', '名古屋経済大学G', 'university', 'tokai'),
  createVenue('nagoya-tech-ground', '名古屋工業大学G', 'university', 'tokai'),
  createVenue('nagoya-sangyo-ground', '名古屋産業大学G', 'university', 'tokai'),
  createVenue('nagoya-city-ground', '名古屋市立大学G', 'university', 'tokai'),
  createVenue('nagoya-commerce-ground', '名古屋商科大学G', 'university', 'tokai'),
  createVenue('nagoya-univ-yamanoue-ground', '名古屋大学山の上G', 'university', 'tokai'),
  createVenue('meijo-nisshin-ground', '名城大学日進G', 'university', 'tokai'),
  createVenue('chuo-university-ground', '中央大学G', 'university', 'other'),
]

export const tokaiStadiumVenues: Venue[] = [
  createVenue('obu-shimin-stadium', '大府市民球場', 'stadium', 'tokai'),
  createVenue('shinrin-park-stadium', '森林公園野球場', 'stadium', 'tokai'),
  createVenue('nagoya-stadium', 'ナゴヤ球場', 'stadium', 'tokai'),
  createVenue('paloma-mizuho-stadium', 'パロマ瑞穂野球場', 'stadium', 'tokai'),
  createVenue('handa-hokubu-stadium', '半田北部球場', 'stadium', 'tokai'),
  createVenue('banterin-dome', 'バンテリンドーム', 'stadium', 'tokai'),
  createVenue('agui-stadium', '阿久比球場', 'stadium', 'tokai'),
  createVenue('ichinomiya-stadium', '一宮球場', 'stadium', 'tokai'),
  createVenue('okazaki-red-diamond', '岡崎レッドダイヤモンドスタジアム', 'stadium', 'tokai'),
  createVenue('gamagori-stadium', '蒲郡球場', 'stadium', 'tokai'),
  createVenue('kariya-stadium', '刈谷球場', 'stadium', 'tokai'),
  createVenue('kasugai-shimin-stadium', '春日井市民球場', 'stadium', 'tokai'),
  createVenue('komaki-shimin-stadium', '小牧市民球場', 'stadium', 'tokai'),
  createVenue('atsuta-aichitokei-120-stadium', '熱田愛知時計120スタジアム', 'stadium', 'tokai'),
  createVenue('toyohashi-shimin-stadium', '豊橋市民球場', 'stadium', 'tokai'),
  createVenue('toyota-sports-park-stadium', '豊田市運動公園野球場', 'stadium', 'tokai'),
]

export const tokaiVenues: Venue[] = [
  ...tokaiUniversityVenues,
  ...tokaiStadiumVenues,
]

export const allVenues: Venue[] = [...tokaiVenues]
