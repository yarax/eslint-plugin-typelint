componentDidMount() {
  const {screenSizesField, groupScreenSizesField, shops, campaignData} = this.props;
  let campaignScreenSizes = [].concat(screenSizesField.value);
  let groupScreenSizes = [].concat(groupScreenSizesField.value);
  let shopScreenSizes = [];
  let shopSlotGroups = [];

  const checkDoesItHaveMedia = (shopId, screenTypeName, screenObj) => {
    const neededShopCampaign = campaignData.shopCampaigns.find(shopCampaign => shopCampaign.shopId === shopId);
    if (neededShopCampaign.media && neededShopCampaign.media.screenTypes) {
      /**
       * @var neededScreenType <campaign.data>
       */
      const neededScreenType = neededShopCampaign.media.screenTypes.find(scScreenType => scScreenType.name === screenTypeName);
      const neededScreenSize = neededScreenType.lolol;
    }
    return false;
  }

  shops.forEach(
    /**
     * @param shop <shop>
     */
    shop => {
      shop.data.screensConfig.screenTypes.forEach(screenType => {
        screenType.slots.forEach(slot => {
          slot.screenSizes.forEach(screenSize => {
            if (checkDoesItHaveMedia(shop._id, screenType.name, screenSize) && !screenTypeExists(screenSize)) {
              shopScreenSizes.push(screenSize);
            }
          });
        });
        _.get(screenType, 'slotGroups', []).forEach(slotGroup => {
          _.get(slotGroup, 'slots', []).forEach((slotGroupSlot) => {
            if (checkDoesItHaveMedia(shop._id, screenType.name, slotGroupSlot) && !screenTypeExists(slotGroupSlot)) {
              shopSlotGroups.push(slotGroupSlot);
            }
          });
        });
      });
    });
  // screen sizes
  campaignScreenSizes = syncScreenSizes(campaignScreenSizes, shopScreenSizes, (o1, o2) => (
    o1.width === o2.width && o1.height === o2.height
  ), (o) => (
  {
    width: o.width,
    height: o.height,
  }
  ));

  // group sreen sizes
  groupScreenSizes = syncScreenSizes(groupScreenSizes, shopSlotGroups, (o1, o2) => (
    o1.name === o2.name
  ), (o) => (
  {
    name: o.name,
  }
  ));
  screenSizesField.onChange(campaignScreenSizes);
  groupScreenSizesField.onChange(groupScreenSizes);
}