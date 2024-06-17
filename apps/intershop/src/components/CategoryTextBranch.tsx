import React from "react";
import { Text, Stack, Flex } from "@contentful/f36-components";

interface CategoryTextBranchType {
  title: string;
  subCategories: Array<CategoryTextBranchType>;
}

interface Props {
  depth?: number;
  category: CategoryTextBranchType;
}

const CategoryTextBranch = ({ depth = 0, category }: Props) => (
  <Stack flexDirection="column" alignItems="baseline" spacing="spacingS">
    <Text
      fontWeight={
        depth === 0
          ? "fontWeightDemiBold"
          : depth < 2
          ? "fontWeightMedium"
          : "fontWeightNormal"
      }
      fontSize={
        depth === 0 ? "fontSize3Xl" : depth < 2 ? "fontSizeXl" : "fontSizeL"
      }
    >
      {category.title}
    </Text>
    <Stack
      spacing="spacing2Xs"
      marginLeft="spacingS"
      flexDirection="column"
      alignItems="baseline"
    >
      {category?.subCategories?.map((subCategory, i) => (
        <CategoryTextBranch category={subCategory} key={i} depth={depth + 1} />
      ))}
    </Stack>
  </Stack>
);

export default CategoryTextBranch;
