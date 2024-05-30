import {
  Heading,
  Flex,
  Skeleton,
  Card,
  Text,
  Button,
} from "@contentful/f36-components";
import { ExtendedGCTemplate } from "@/type/types";

interface TemplatesProps {
  projectName?: string;
  templates?: ExtendedGCTemplate[];
  select: (template: ExtendedGCTemplate) => void;
}

export function Templates({
  templates,
  select,
  projectName = "",
}: TemplatesProps) {
  return (
    <>
      <Heading marginTop="spacingXl">{`"${projectName}" project templates:`}</Heading>
      {templates?.length ? (
        <Flex flexDirection="column" gap="spacingS">
          {templates.map((template) => {
            const isMapped = !!template.mappedCFModel;
            return (
              <Card
                key={template.id}
                style={{ background: isMapped ? "#f4f3f3" : "#FFF" }}
              >
                <Flex justifyContent="space-between" alignItems="center">
                  <Text fontSize="fontSizeL">{template.name}</Text>
                  <Button
                    variant={isMapped ? "primary" : "positive"}
                    onClick={() => select(template)}
                  >
                    {isMapped ? "Edit mapping" : "Map template"}
                  </Button>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      ) : (
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={4} />
        </Skeleton.Container>
      )}
    </>
  );
}
