// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import Link from 'next/link';
import * as S from './Banner.styled';
import Bugsnag from '@bugsnag/js';

const Banner = () => {
  const onButtonClick = () => {
    Bugsnag.notify(new Error('Test error'));
  };

  return (
    <S.Banner>
      <S.ImageContainer>
        <S.BannerImg />
      </S.ImageContainer>
      <S.TextContainer>
        <S.Title>The best telescopes to see the world closer</S.Title>
        <Link href="#hot-products" onClick={onButtonClick}>
          <S.GoShoppingButton>Go Shopping</S.GoShoppingButton>
        </Link>
      </S.TextContainer>
    </S.Banner>
  );
};

export default Banner;
