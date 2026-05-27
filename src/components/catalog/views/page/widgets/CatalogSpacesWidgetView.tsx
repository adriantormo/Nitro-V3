import { FC, useEffect, useRef, useState } from 'react';
import { IPurchasableOffer, LocalizeText, Offer, ProductTypeEnum } from '../../../../../api';
import { AutoGrid, AutoGridProps, Button } from '../../../../../common';
import { useCatalogData, useCatalogUiState } from '../../../../../hooks';
import { CatalogGridOfferView } from '../common/CatalogGridOfferView';

interface CatalogSpacesWidgetViewProps extends AutoGridProps
{

}

const SPACES_GROUP_NAMES = [ 'floors', 'walls', 'views' ];

const getSpacesGroupIndex = (offer: IPurchasableOffer) =>
{
    const product = offer.product;

    if(!product || ((product.productType !== ProductTypeEnum.WALL) && (product.productType !== ProductTypeEnum.FLOOR))) return -1;

    const className = product.furnitureData?.className || '';

    switch(className || offer.localizationId.split('_single_')[0])
    {
        case 'floor':
            return 0;
        case 'wallpaper':
            return 1;
        case 'landscape':
            return 2;
        default:
            return -1;
    }
};

export const CatalogSpacesWidgetView: FC<CatalogSpacesWidgetViewProps> = props =>
{
    const { columnCount = 5, children = null, ...rest } = props;
    const [ groupedOffers, setGroupedOffers ] = useState<IPurchasableOffer[][]>(null);
    const [ selectedGroupIndex, setSelectedGroupIndex ] = useState(-1);
    const [ selectedOfferForGroup, setSelectedOfferForGroup ] = useState<IPurchasableOffer[]>(null);
    const { currentPage = null, currentOffer = null } = useCatalogData();
    const { setCurrentOffer = null, setPurchaseOptions = null } = useCatalogUiState();
    const elementRef = useRef<HTMLDivElement>(null);

    const setSelectedOffer = (offer: IPurchasableOffer) =>
    {
        if(!offer) return;

        setSelectedOfferForGroup(prevValue =>
        {
            const newValue = [ ...prevValue ];

            newValue[selectedGroupIndex] = offer;

            return newValue;
        });
    };

    useEffect(() =>
    {
        if(!currentPage) return;

        const groupedOffers: IPurchasableOffer[][] = [ [], [], [] ];

        for(const offer of currentPage.offers)
        {
            if((offer.pricingModel !== Offer.PRICING_MODEL_SINGLE) && (offer.pricingModel !== Offer.PRICING_MODEL_MULTI)) continue;

            const groupIndex = getSpacesGroupIndex(offer);

            if(groupIndex === -1) continue;

            groupedOffers[groupIndex].push(offer);
        }

        setGroupedOffers(groupedOffers);
        setSelectedGroupIndex(groupedOffers.findIndex(offers => offers.length));
        setSelectedOfferForGroup([ groupedOffers[0][0], groupedOffers[1][0], groupedOffers[2][0] ]);
    }, [ currentPage ]);

    useEffect(() =>
    {
        if((selectedGroupIndex === -1) || !selectedOfferForGroup) return;

        setCurrentOffer(selectedOfferForGroup[selectedGroupIndex] || null);

    }, [ selectedGroupIndex, selectedOfferForGroup, setCurrentOffer ]);

    useEffect(() =>
    {
        if((selectedGroupIndex === -1) || !selectedOfferForGroup || !currentOffer) return;

        const selectedOffer = selectedOfferForGroup[selectedGroupIndex];

        if(!selectedOffer?.product) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.extraData = selectedOffer.product.extraParam;
            newValue.extraParamRequired = true;

            return newValue;
        });
    }, [ currentOffer, selectedGroupIndex, selectedOfferForGroup, setPurchaseOptions ]);

    useEffect(() =>
    {
        if(elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [ selectedGroupIndex ]);

    if(!groupedOffers || (selectedGroupIndex === -1)) return null;

    const offers = groupedOffers[selectedGroupIndex];

    return (
        <>
            <div className="relative inline-flex align-middle">
                { SPACES_GROUP_NAMES.map((name, index) => <Button key={ index } active={ (selectedGroupIndex === index) } onClick={ event => setSelectedGroupIndex(index) }>{ LocalizeText(`catalog.spaces.tab.${ name }`) }</Button>) }
            </div>
            <AutoGrid columnCount={ columnCount } innerRef={ elementRef } { ...rest }>
                { offers && (offers.length > 0) && offers.map((offer, index) => <CatalogGridOfferView key={ index } itemActive={ (currentOffer && (currentOffer === offer)) } offer={ offer } selectOffer={ offer => setSelectedOffer(offer) } />) }
                { children }
            </AutoGrid>
        </>
    );
};
