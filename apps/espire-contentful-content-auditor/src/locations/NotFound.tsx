import { Flex } from "@contentful/f36-components";
const NotFound = () => {
  return (
    <Flex className="flex-design h-400-page flex-direction justify-content-center item-align">
      <img
        src="/images/no-image.png"
        alt="No image available"
        width={290}
        height={200}
      />
      <span className="title-no">No Results Found</span>
      <span className="title-small">
        No unused entries, media, or content types found!
      </span>
    </Flex>
  );
};

export default NotFound;
