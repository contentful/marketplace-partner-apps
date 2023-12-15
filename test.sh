paths_released='["apps/bynder", "apps/shopify", "apps/surfer"]'
echo "$paths_released" | jq -r '.[]' | while read -r path
  do echo "do something with $path"
done
