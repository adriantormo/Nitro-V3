import { GetSessionDataManager, IFurnitureData } from '@nitrots/nitro-renderer';
import { ProductTypeEnum } from '../../catalog';

export function GetFurnitureData(furniClassId: number, productType: string): IFurnitureData
{
    let furniData: IFurnitureData = null;
    const sessionDataManager = GetSessionDataManager();

    switch(productType.toLowerCase())
    {
        case ProductTypeEnum.FLOOR:
            furniData = sessionDataManager.getFloorItemData(furniClassId);
            break;
        case ProductTypeEnum.WALL: {
            furniData = sessionDataManager.getWallItemData(furniClassId);

            if(furniData) break;

            switch(furniClassId)
            {
                case 19894:
                    furniData = sessionDataManager.getWallItemDataByName('floor') || sessionDataManager.getWallItemData(6);
                    break;
                case 19896:
                    furniData = sessionDataManager.getWallItemDataByName('wallpaper') || sessionDataManager.getWallItemData(5);
                    break;
                case 19926:
                    furniData = sessionDataManager.getWallItemDataByName('landscape') || sessionDataManager.getWallItemData(4055);
                    break;
            }

            break;
        }
    }

    return furniData;
}
